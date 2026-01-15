use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::{PgPool, Row};
use uuid::Uuid;
use crate::blueprint::Blueprint;
use crate::commits;

// Use the shared type from calc-engine or redefine if not exposing rlib yet. 
// Ideally we use: use calc_engine::{ModuleBlueprint, ValidationContext, validate_blueprint};
// But for now, we map our internal Blueprint to the shared struct string or reuse the logic.
// The `Blueprint` struct in `src/blueprint.rs` is slightly different or needs to be aligned.
// For this step, we will use the `calc_engine` logic.

#[derive(Deserialize)]
pub struct PublishRequest {
    pub blueprint: Value, // Receive as raw JSON to pass to validator
}

pub async fn publish_module(
    State(pool): State<PgPool>,
    Json(payload): Json<PublishRequest>,
) -> Result<Json<Value>, (StatusCode, String)> {
    
    // 1. Construct Validation Context
    // TODO: Fetch actual modules from DB to populate this.
    let context_json = json!({
        "existing_modules": ["incidents", "risks", "sites", "people"], // Mock for now
        "dependencies": {}
    }).to_string();
    
    let blueprint_json = payload.blueprint.to_string();

    // 2. Run Pre-flight Check (Isomorphic Logic)
    match calc_engine::validate_blueprint(&blueprint_json, &context_json) {
        Ok(true) => {
            // Validation Passed
        },
        Ok(false) => return Err((StatusCode::BAD_REQUEST, "Validation failed generic".into())),
        Err(e) => return Err((StatusCode::BAD_REQUEST, format!("Validation Error: {}", e))),
    };

    // 3. Log to Ledger (Schema Lock)
    let module_name = payload.blueprint["name"].as_str()
        .ok_or((StatusCode::BAD_REQUEST, "Missing module name".into()))?;

    commits::log_commit(&pool, module_name, &payload.blueprint)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Ledger Error: {}", e)))?;

    // 4. Execute SQL (Create Table)
    // Map JSON to internal Blueprint struct
    let blueprint: Blueprint = serde_json::from_value(payload.blueprint.clone())
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Blueprint Parse Error: {}", e)))?;

    let sql = blueprint.to_sql();
    
    // Execute the DDL
    // Note: In production, we'd handle ALTER TABLE vs CREATE TABLE diffs.
    // For specific "CREATE TABLE IF NOT EXISTS", it might be safe to run blindly if new.
    // Ideally we wrap this in a transaction.
    
    let mut tx = pool.begin().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if let Err(e) = sqlx::query(&sql).execute(&mut *tx).await {
        tx.rollback().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        return Err((StatusCode::BAD_REQUEST, format!("SQL Execution Error: {}", e)));
    }

    // Also register in a master `modules` table if we had one, but we use the table existence as registry.
    
    tx.commit().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(json!({ 
        "status": "published", 
        "module": module_name,
        "message": "Module successfully manufactured and locked." 
    })))
}
