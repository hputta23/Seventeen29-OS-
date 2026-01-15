use sqlx::postgres::{PgPool, PgPoolOptions};
use std::env;
use anyhow::Result;

pub async fn init_pool() -> Result<PgPool> {
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://seventeen29:password123@localhost:5432/seventeen29_kernel".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    Ok(pool)
}
