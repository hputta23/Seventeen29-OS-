use sqlx::PgPool;
use uuid::Uuid;
use serde_json::Value;

pub async fn init_commits_ledger(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS blueprint_commits (
            id UUID PRIMARY KEY,
            module_name TEXT NOT NULL,
            version INT NOT NULL,
            blueprint JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn log_commit(pool: &PgPool, module_name: &str, blueprint: &Value) -> Result<(), sqlx::Error> {
    // 1. Get latest version
    let row: Option<(i32,)> = sqlx::query_as(
        "SELECT version FROM blueprint_commits WHERE module_name = $1 ORDER BY version DESC LIMIT 1"
    )
    .bind(module_name)
    .fetch_optional(pool)
    .await?;

    let new_version = row.map(|r| r.0 + 1).unwrap_or(1);

    // 2. Insert new commit
    sqlx::query(
        "INSERT INTO blueprint_commits (id, module_name, version, blueprint) VALUES ($1, $2, $3, $4)"
    )
    .bind(Uuid::new_v4())
    .bind(module_name)
    .bind(new_version)
    .bind(blueprint)
    .execute(pool)
    .await?;

    Ok(())
}
