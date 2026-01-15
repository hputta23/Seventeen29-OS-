use sqlx::PgPool;
use anyhow::Result;
use tracing::info;

pub async fn init_graph_schema(pool: &PgPool) -> Result<()> {
    // 1. Create the neural_edges table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS neural_edges (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            source_id UUID NOT NULL,
            source_module TEXT NOT NULL,
            target_id UUID NOT NULL,
            target_module TEXT NOT NULL,
            relation TEXT NOT NULL,
            properties JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        "#
    )
    .execute(pool)
    .await?;

    // 2. Optimization: Composite Index for fast traversals
    // This makes querying "Everything related to X" extremely fast
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_neural_edges_source_target ON neural_edges (source_id, target_id);"
    )
    .execute(pool)
    .await?;
    
    // Also index target_id alone for reverse lookups if needed (though source_target helps, reverse is usually needed too)
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_neural_edges_target ON neural_edges (target_id);"
    )
    .execute(pool)
    .await?;

    // 3. Optimization: GIN Index for JSONB properties
    // Allows searching for edges with specific weights or metadata
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_neural_edges_properties ON neural_edges USING GIN (properties);"
    )
    .execute(pool)
    .await?;

    info!("Neural Graph Schema initialized successfully.");
    Ok(())
}
