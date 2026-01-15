use axum::{
    extract::{State, Json, Path},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;
use crate::blueprint::Blueprint;
use crate::graph_service::{GraphService, CreateLinkRequest};
use crate::commits;
use serde::Deserialize; 

pub async fn create_module(
    State(pool): State<PgPool>,
    Json(blueprint): Json<Blueprint>,
) -> impl IntoResponse {
    let sql = blueprint.to_sql();
    
    // Execute the generated SQL to create the table
    match sqlx::query(&sql).execute(&pool).await {
        Ok(_) => (
            StatusCode::CREATED,
            Json(json!({ "message": "Module created successfully", "sql": sql })),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        ),
    }
}

pub async fn create_link(
    State(pool): State<PgPool>,
    Json(req): Json<CreateLinkRequest>,
) -> impl IntoResponse {
    match GraphService::link_entities(&pool, req).await {
        Ok(_) => (
            StatusCode::CREATED,
            Json(json!({ "message": "Link created and propagated successfully" })),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        ),
    }
}

pub async fn check_handshake(
    State(pool): State<PgPool>,
    axum::extract::Path(incident_id): axum::extract::Path<uuid::Uuid>,
) -> impl IntoResponse {
    match GraphService::check_incident_handshake(&pool, incident_id).await {
        Ok(result) => (
            StatusCode::OK,
            Json(json!(result)),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        ),
    }
}

// New Endpoint: Get Module Metadata
pub async fn get_module_metadata(
    State(pool): State<PgPool>,
    axum::extract::Path(module_name): axum::extract::Path<String>,
) -> impl IntoResponse {
    use sqlx::Row;
    
    // Fetch latest blueprint from the ledger
    let row = sqlx::query(
        "SELECT blueprint FROM blueprint_commits WHERE module_name = $1 ORDER BY version DESC LIMIT 1"
    )
    .bind(&module_name)
    .fetch_optional(&pool)
    .await;

    match row {
        Ok(Some(record)) => {
            let blueprint: serde_json::Value = record.try_get("blueprint").unwrap_or(json!({}));
            // Return just the blueprint content expected by frontend
            // The frontend might expect { name: "...", fields: [...] } which maps to our Blueprint struct
            Json(blueprint).into_response()
        },
        Ok(None) => {
            // Fallback to hardcoded/mocked for system modules if not in DB yet (or return 404)
            let fields = match module_name.as_str() {
                "incidents" => vec![
                    json!({"name": "description", "type": "text", "required": true}),
                    json!({"name": "severity", "type": "number", "required": true}),
                ],
                "risks" => vec![
                    json!({"name": "title", "type": "text", "required": true}),
                    json!({"name": "status", "type": "enum", "options": ["OPEN", "MITIGATED", "REQUIRES_REVIEW"]}),
                ],
                "sites" => vec![
                    json!({"name": "name", "type": "text", "required": true}),
                    json!({"name": "location", "type": "text", "required": false}),
                ],
                 _ => return (StatusCode::NOT_FOUND, Json(json!({"error": "Module not found"}))).into_response(),
            };
        
            Json(json!({
                "name": module_name,
                "fields": fields
            })).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response(),
    }
}

// New Endpoint: Get Records (Generic Select)
pub async fn get_records(
    State(pool): State<PgPool>,
    axum::extract::Path(module_name): axum::extract::Path<String>,
) -> impl IntoResponse {
    use sqlx::Row;
    // SECURITY WARNING: In production, sanitize 'module_name' or use a whitelist to prevent SQL Injection
    let json_sql = format!("SELECT json_agg(t) as data FROM (SELECT * FROM {} LIMIT 50) t", module_name);
    
    let res = sqlx::query(&json_sql).fetch_one(&pool).await;
    
    match res {
        Ok(row) => {
             let data: Option<serde_json::Value> = row.try_get("data").unwrap_or(None);
             Json(data.unwrap_or(json!([])))
        },
        Err(e) => Json(json!({"error": e.to_string()}))
    }
}

// New Endpoint: Create Record
pub async fn create_record(
    State(pool): State<PgPool>,
    axum::extract::Path(module_name): axum::extract::Path<String>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    use sqlx::Row;
    
    // Extract field names and values from payload
    let obj = match payload.as_object() {
        Some(o) => o,
        None => return (StatusCode::BAD_REQUEST, Json(json!({"error": "Invalid payload"}))).into_response(),
    };
    
    let mut field_names = Vec::new();
    let mut field_values = Vec::new();
    
    for (key, value) in obj.iter() {
        if key != "id" && key != "created_at" && key != "updated_at" {
            field_names.push(key.clone());
            field_values.push(value.clone());
        }
    }
    
    if field_names.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({"error": "No fields provided"}))).into_response();
    }
    
    // Build INSERT query dynamically
    let placeholders: Vec<String> = (1..=field_names.len()).map(|i| format!("${}", i)).collect();
    let insert_sql = format!(
        "INSERT INTO {} ({}) VALUES ({}) RETURNING id",
        module_name,
        field_names.join(", "),
        placeholders.join(", ")
    );
    
    // Build query with bindings
    let mut query = sqlx::query(&insert_sql);
    for value in &field_values {
        // Convert JSON value to appropriate SQL type
        query = match value {
            serde_json::Value::String(s) => {
                // Treat empty strings as NULL for optional fields
                if s.is_empty() {
                    query.bind(None::<String>)
                } else {
                    query.bind(s)
                }
            },
            serde_json::Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    query.bind(i)
                } else if let Some(f) = n.as_f64() {
                    query.bind(f)
                } else {
                    query.bind(n.to_string())
                }
            },
            serde_json::Value::Bool(b) => query.bind(b),
            serde_json::Value::Null => query.bind(None::<String>),
            _ => query.bind(value.to_string()),
        };
    }
    
    match query.fetch_one(&pool).await {
        Ok(row) => {
            let id: uuid::Uuid = row.try_get("id").unwrap_or_default();
            (StatusCode::CREATED, Json(json!({"id": id, "message": "Record created successfully"}))).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response(),
    }
}

// Migration endpoint to fix constraints
pub async fn migrate_moc(
    State(pool): State<PgPool>,
) -> impl IntoResponse {
    let result = sqlx::query("ALTER TABLE management_of_change ALTER COLUMN owner_id DROP NOT NULL")
        .execute(&pool)
        .await;
    
    match result {
        Ok(_) => (StatusCode::OK, Json(json!({"message": "Migration successful"}))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response(),
    }
}

// --- Publish Logic ---
#[derive(Deserialize)]
pub struct PublishRequest {
    pub blueprint: Value, 
}

pub async fn publish_module(
    State(pool): State<PgPool>,
    Json(payload): Json<PublishRequest>,
) -> impl IntoResponse {
    
    // 1. Construct Context (Mocked for Phase 2.5)
    let context_json = json!({
        "existing_modules": ["incidents", "risks", "sites", "people"], 
        "dependencies": {}
    }).to_string();
    
    let blueprint_json = payload.blueprint.to_string();

    // 2. Pre-flight Check (Isomorphic)
    match calc_engine::validate_blueprint(&blueprint_json, &context_json) {
        Ok(true) => {},
        Ok(false) => return (StatusCode::BAD_REQUEST, Json(json!({"error": "Validation failed"}))).into_response(),
        Err(e) => return (StatusCode::BAD_REQUEST, Json(json!({"error": format!("Validation Error: {}", e)}))).into_response(),
    };

    // 3. Schema Lock
    let module_name = match payload.blueprint["name"].as_str() {
        Some(name) => name,
        None => return (StatusCode::BAD_REQUEST, Json(json!({"error": "Missing module name"}))).into_response(),
    };

    if let Err(e) = commits::log_commit(&pool, module_name, &payload.blueprint).await {
         return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": format!("Ledger Error: {}", e)}))).into_response();
    }

    // 4. SQL Execution
    let blueprint: Blueprint = match serde_json::from_value(payload.blueprint.clone()) {
        Ok(bp) => bp,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response(),
    };

    let sql = blueprint.to_sql();
    let mut tx = match pool.begin().await {
        Ok(tx) => tx,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response(),
    };

    if let Err(e) = sqlx::query(&sql).execute(&mut *tx).await {
         return (StatusCode::BAD_REQUEST, Json(json!({"error": format!("SQL Error: {}", e)}))).into_response();
    }

    if let Err(e) = tx.commit().await {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response();
    }

    (StatusCode::OK, Json(json!({ "status": "published", "module": module_name }))).into_response()
}

// --- Sync Logic ---
use crate::sync_service::{self, SyncRequest};

pub async fn sync_bundle(
    State(pool): State<PgPool>,
) -> impl IntoResponse {
    // In real implementation, we'd parse query params for 'last_sync_timestamp'
    let req = SyncRequest { last_sync_timestamp: None };

    match sync_service::generate_sync_bundle(&pool, req).await {
        Ok(bundle) => (StatusCode::OK, Json(bundle)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response(),
    }
}

pub async fn get_risk_heatmap(
    State(pool): State<PgPool>,
    Path(root_id): Path<Uuid>,
) -> impl IntoResponse {
    use crate::graph_service;
    
    match graph_service::GraphService::get_risk_rollup(&pool, root_id).await {
        Ok(rollup) => (StatusCode::OK, Json(rollup)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response(),
    }
}

#[derive(Deserialize)]
pub struct RcaRequest {
    pub description: String,
}

pub async fn analyze_rca(
    State(pool): State<PgPool>,
    Json(payload): Json<RcaRequest>,
) -> impl IntoResponse {
    use crate::ai_service;
    
    match ai_service::AiService::analyze_root_cause(&pool, &payload.description).await {
        Ok(analysis) => (StatusCode::OK, Json(json!({"analysis": analysis}))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response(),
    }
}

// --- White-Labeling ---
pub async fn get_theme_config() -> impl IntoResponse {
    // Mocked Tenant Config (Enterprise Feature)
    // In production, fetch from DB based on 'Host' header or Tenant ID
    let theme = json!({
        "primaryColor": "#00F0FF", // Neon Cyan (Default)
        "glassOpacity": "0.25",
        "borderRadius": "12px",
        "fontFamily": "Inter, sans-serif"
    });
    
    (StatusCode::OK, Json(theme)).into_response()
}
