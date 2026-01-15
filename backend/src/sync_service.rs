use sqlx::PgPool;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use crate::commits;

#[derive(Deserialize)]
pub struct SyncRequest {
    pub last_sync_timestamp: Option<chrono::NaiveDateTime>,
    // In a real app, we'd have user_location, role_id, etc. for filtering Priority 2 data
}

#[derive(Serialize)]
pub struct SyncBundle {
    pub priority_1: Priority1Data,
    pub priority_2: Priority2Data,
    pub priority_3: Priority3Data,
    pub server_timestamp: chrono::NaiveDateTime,
}

#[derive(Serialize)]
pub struct Priority1Data {
    pub blueprints: Vec<Value>, // Latest schemas
    pub action_items: Vec<Value>, // Assigned tasks
}

#[derive(Serialize)]
pub struct Priority2Data {
    pub sites: Vec<Value>,
    pub assets: Vec<Value>, // "1st Degree" connections
}

#[derive(Serialize)]
pub struct Priority3Data {
    pub people_registry: Vec<Value>, // Background data
}

pub async fn generate_sync_bundle(pool: &PgPool, _req: SyncRequest) -> Result<SyncBundle, sqlx::Error> {
    // 1. Fetch Latest Blueprints (Priority 1)
    // Query the commits ledger for the absolute latest version of each module
    let blueprints = sqlx::query_as::<_, (Value,)>(
        r#"
        SELECT DISTINCT ON (module_name) blueprint 
        FROM blueprint_commits 
        ORDER BY module_name, version DESC
        "#
    )
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(|r| r.0)
    .collect();

    // 2. Fetch Foundation Data (Priority 2) - Mocked for "Seventeen29" context
    // In reality, we would filter this by the user's assigned Site ID.
    let sites = vec![
        json!({"id": "site_1", "name": "Alpha Mine", "location": "Sector 7"}),
        json!({"id": "site_2", "name": "Bravo Factory", "location": "Sector 4"}),
    ];

    let assets = vec![
        json!({"id": "asset_101", "name": "Haul Truck 7", "site_id": "site_1"}),
        json!({"id": "asset_102", "name": "Conveyor Belt A", "site_id": "site_2"}),
    ];

    // 3. Background Data (Priority 3)
    let people_registry = vec![
        json!({"id": "user_1", "name": "Operator Joe"}),
        json!({"id": "user_2", "name": "Inspector Jane"}),
    ];

    Ok(SyncBundle {
        priority_1: Priority1Data {
            blueprints,
            action_items: vec![], // No tasks yet
        },
        priority_2: Priority2Data {
            sites,
            assets,
        },
        priority_3: Priority3Data {
            people_registry,
        },
        server_timestamp: chrono::Utc::now().naive_utc(),
    })
}
