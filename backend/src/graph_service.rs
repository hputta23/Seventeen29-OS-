use sqlx::PgPool;
use uuid::Uuid;
use anyhow::Result;
use tracing::info;

// Struct to represent a Link Request
#[derive(serde::Deserialize)]
pub struct CreateLinkRequest {
    pub source_id: Uuid,
    pub source_module: String,
    pub target_id: Uuid,
    pub target_module: String,
    pub relation: String,
}

pub struct GraphService;

impl GraphService {
    /// Creates a bidirectional link between two entities
    pub async fn link_entities(pool: &PgPool, req: CreateLinkRequest) -> Result<()> {
        let tx = pool.begin().await?;

        // 1. Create Forward Edge
        sqlx::query(
            "INSERT INTO neural_edges (source_id, source_module, target_id, target_module, relation) VALUES ($1, $2, $3, $4, $5)"
        )
        .bind(req.source_id)
        .bind(&req.source_module)
        .bind(req.target_id)
        .bind(&req.target_module)
        .bind(&req.relation)
        .execute(pool)
        .await?;

        // 2. Create Reverse Edge (Enforce Symmetry)
        // Logic: If A MITIGATES B, then B IS_MITIGATED_BY A
        let reverse_relation = Self::get_reverse_relation(&req.relation);
        sqlx::query(
            "INSERT INTO neural_edges (source_id, source_module, target_id, target_module, relation) VALUES ($1, $2, $3, $4, $5)"
        )
        .bind(req.target_id)
        .bind(&req.target_module)
        .bind(req.source_id)
        .bind(&req.source_module)
        .bind(reverse_relation)
        .execute(pool)
        .await?;
        
        // 3. Trigger Propagation Logic (The "Neural" Reaction)
        // If an Incident is linked to a Risk, flag the Risk.
        if req.source_module == "incidents" && req.target_module == "risks" {
             crate::propagation::PropagationService::flag_risk(pool, req.target_id).await?;
        }

        info!("Linked {} <-> {}", req.source_id, req.target_id);
        Ok(())
    }

    fn get_reverse_relation(relation: &str) -> String {
        match relation {
            "MITIGATED_BY" => "MITIGATES".to_string(),
            "MITIGATES" => "MITIGATED_BY".to_string(),
            "INVOLVES" => "INVOLVED_IN".to_string(),
            "INVOLVED_IN" => "INVOLVES".to_string(),
            _ => "RELATED_TO".to_string(), // Default fallback
        }
    }

    /// The "Neural Handshake": Checks if an Incident has the required safety links
    pub async fn check_incident_handshake(pool: &PgPool, incident_id: Uuid) -> Result<HandshakeResult> {
        // 1. Check for Linked Risk Assessment
        // Using runtime query (sqlx::query) to avoid compile-time DB checks for prototype
        use sqlx::Row;
        
        let risks = sqlx::query(
            "SELECT target_id, relation FROM neural_edges 
             WHERE source_id = $1 AND relation = 'MITIGATED_BY' AND target_module = 'risks'"
        )
        .bind(incident_id)
        .fetch_all(pool)
        .await?;

        let risk_status = if risks.is_empty() {
             "UNMITIGATED_HAZARD"
        } else {
             "MITIGATED"
        };

        // 2. Check involved people (Simple check for now)
        let people = sqlx::query(
            "SELECT target_id FROM neural_edges 
             WHERE source_id = $1 AND relation = 'INVOLVES' AND target_module = 'people'"
        )
        .bind(incident_id)
        .fetch_all(pool)
        .await?;

        Ok(HandshakeResult {
            incident_id,
            risk_status: risk_status.to_string(),
            linked_risks: risks.len() as i32,
            involved_people: people.len() as i32,
        })
    }
}

#[derive(serde::Serialize)]
pub struct HandshakeResult {
    pub incident_id: Uuid,
    pub risk_status: String,
    pub linked_risks: i32,
    pub involved_people: i32,
}

#[derive(serde::Serialize)]
pub struct RiskRollup {
    pub root_id: Uuid,
    pub total_risk_score: i64,
    pub incident_count: i64,
    pub asset_count: i64,
}

impl GraphService {
    /// Calculates the "Safety Heatmap" for a given Entity (Site, Asset Type, etc.)
    /// Uses Recursive CTE to traverse hierarchy and sum weighted risks.
    pub async fn get_risk_rollup(pool: &PgPool, root_id: Uuid) -> Result<RiskRollup> {
        // Weighted Logic:
        // - Incident (High Severity) = 10 (Mocked as 'severe')
        // - Incident (Low Severity) = 1 (Default)
        // - Near Miss = 2
        
        let row = sqlx::query!(
            r#"
            WITH RECURSIVE hierarchy AS (
                -- Base Case: The Root Node
                SELECT target_id as id, 1 as depth
                FROM neural_edges
                WHERE source_id = $1 AND relation = 'CONTAINS'
                
                UNION ALL
                
                -- Recursive Step: Find children (Assets in Zones, etc.)
                SELECT e.target_id, h.depth + 1
                FROM neural_edges e
                INNER JOIN hierarchy h ON e.source_id = h.id
                WHERE e.relation = 'CONTAINS' AND h.depth < 5
            ),
            
            -- Find Incidents linked to these entities
            linked_incidents AS (
                SELECT i.source_id as incident_id
                FROM neural_edges i
                JOIN hierarchy h ON i.target_id = h.id  -- Incident -> Asset
                WHERE i.relation = 'INVOLVES' AND i.source_module = 'incidents'
                
                UNION
                
                -- Also include incidents linked directly to ROOT
                SELECT i.source_id
                FROM neural_edges i
                WHERE i.target_id = $1 AND i.relation = 'INVOLVES' AND i.source_module = 'incidents'
            )
            
            -- Aggregation
            SELECT 
                COUNT(DISTINCT incident_id) as incident_count,
                (SELECT COUNT(*) FROM hierarchy) as asset_count
            FROM linked_incidents
            "#,
            root_id
        )
        .fetch_one(pool)
        .await?;

        // Simple mock weighting (Severity = 5 per incident) until we join with `records` table attributes
        // In production, we'd join `linked_incidents` with `records` to get actual `severity` field.
        let weighted_score = row.incident_count.unwrap_or(0) * 5; 

        Ok(RiskRollup {
            root_id,
            total_risk_score: weighted_score,
            incident_count: row.incident_count.unwrap_or(0),
            asset_count: row.asset_count.unwrap_or(0),
        })
    }
}
