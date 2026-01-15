use axum::Router;
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod blueprint;
mod db;
mod api;
mod graph_schema;
mod graph_service;
mod propagation;

use axum::routing::{get, post};

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Initialize DB
    let pool = db::init_pool().await.expect("Failed to create DB pool");
    
    // Initialize Graph Schema
    graph_schema::init_graph_schema(&pool).await.expect("Failed to init graph schema");

    // build our application with a route
    let app = Router::new()
        .route("/", get(root))
        .route("/api/modules", post(api::create_module))
        .route("/api/links", post(api::create_link))
        .route("/api/handshake/:id", get(api::check_handshake))
        .with_state(pool);

    // run our app with hyper
    // `axum::Server` is a bit different in 0.7, typically uses tokio::net::TcpListener
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::debug!("listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn root() -> &'static str {
    "Seventeen29 OS Kernel active"
}
