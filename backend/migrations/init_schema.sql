-- Enable pgcrypto just in case, though Postgres 15 has gen_random_uuid built-in
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Neural Edges Table (from graph_schema.rs)
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

CREATE INDEX IF NOT EXISTS idx_neural_edges_source_target ON neural_edges (source_id, target_id);
CREATE INDEX IF NOT EXISTS idx_neural_edges_target ON neural_edges (target_id);
CREATE INDEX IF NOT EXISTS idx_neural_edges_properties ON neural_edges USING GIN (properties);

-- Blueprint Commits Table (from commits.rs)
CREATE TABLE IF NOT EXISTS blueprint_commits (
    id UUID PRIMARY KEY,
    module_name TEXT NOT NULL,
    version INT NOT NULL,
    blueprint JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
