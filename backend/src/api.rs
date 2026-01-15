use axum::{
    extract::{State, Json},
    http::StatusCode,
    response::IntoResponse,
};
use serde_json::json;
use sqlx::PgPool;
use crate::blueprint::Blueprint;
use crate::graph_service::{GraphService, CreateLinkRequest};

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
