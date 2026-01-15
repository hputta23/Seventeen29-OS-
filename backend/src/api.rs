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
    State(_pool): State<PgPool>,
    axum::extract::Path(module_name): axum::extract::Path<String>,
) -> impl IntoResponse {
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
         _ => vec![json!({"name": "name", "type": "text", "required": true})],
    };

    Json(json!({
        "name": module_name,
        "fields": fields
    }))
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
