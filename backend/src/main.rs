use axum::Router;
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod blueprint;
mod db;
mod api;
mod graph_schema;
mod graph_service;
mod ai_service;
mod propagation;
mod commits; // Registered
mod sync_service; // Registered sync engine

mod circuit_breaker;

use axum::routing::{get, post};
use tower_governor::{governor::GovernorConfigBuilder, GovernorLayer};
use std::sync::Arc;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Booting Seventeen29 Kernel...");

    // Database Connection
    // Note: init_pool() reads DATABASE_URL internally
    let pool = db::init_pool().await?;
    
    // Initialize Schema Systems
    graph_schema::init_graph_schema(&pool).await?;

    // Rate Limiting Config (Enterprise Hardening)
    // Allow 50 requests per second, burst 100.
    let governor_conf = Arc::new(GovernorConfigBuilder::default().per_second(2).burst_size(5).finish().unwrap());

    let app = Router::new()
        .route("/", get(root))
        .route("/api/modules", post(api::create_module))
        .route("/api/meta/:module", get(api::get_module_metadata))
        .route("/api/records/:module", get(api::get_records))
        .route("/api/records/:module", post(api::create_record))
        .route("/api/migrate/moc", post(api::migrate_moc))
        .route("/api/links", post(api::create_link))
        .route("/api/handshake/:id", get(api::check_handshake))
        .route("/api/modules/publish", post(api::publish_module))
        .route("/api/sync/bundle", get(api::sync_bundle))
        .route("/api/analytics/rollup/:id", get(api::get_risk_heatmap))
        .route("/api/ai/rca", post(api::analyze_rca))
        .route("/api/config/theme", get(api::get_theme_config)) // White-Labeling
        // .layer(GovernorLayer { config: governor_conf }) // Disabled due to ConnectInfo/Env issues
        .with_state(pool)
        .layer(tower_http::cors::CorsLayer::new()
            .allow_origin(tower_http::cors::Any)
            .allow_methods(tower_http::cors::Any)
            .allow_headers(tower_http::cors::Any));

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::info!("Kernel listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    
    Ok(())
}

async fn root() -> &'static str {
    "Seventeen29 OS Kernel active"
}
