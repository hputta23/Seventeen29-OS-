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
