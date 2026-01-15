use serde::{Deserialize, Serialize};

// Feature Flags for optional module capabilities
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FeatureFlag {
    WorkflowStages,
    ConditionalLogic,
    FormulaEngine,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Blueprint {
    pub name: String,
    pub fields: Vec<Field>,
    pub enabled_features: Option<Vec<FeatureFlag>>,
    pub workflow: Option<WorkflowConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Field {
    pub name: String,
    pub label: String, // UI Label, required by calc-engine validation
    pub field_type: SimpleFieldType,
    #[serde(default)]
    pub required: bool,
    
    // Extra properties for specific types
    pub options: Option<Vec<String>>, // For Enum
    pub target_blueprint: Option<String>, // For Link
    
    // Advanced Properties
    pub formula: Option<String>, // For Math Engine
    pub logic: Option<Vec<LogicRule>>, // For Layout Engine
    pub stage_id: Option<String>, // For Workflow Stages: "initiation", "screening", etc.
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SimpleFieldType {
    Text,
    Number,
    Boolean,
    DateTime,
    Enum,
    Link,
    Json, // Added for flexibility
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogicRule {
    pub trigger_field: String,
    pub trigger_value: String, // "Yes", "true", etc.
    pub action: String, // "show", "hide", "require"
    pub target_field: String, // Field to affect
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowConfig {
    pub stages: Vec<WorkflowStage>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowStage {
    pub id: String, // "initiation", "screening", etc.
    pub name: String, // "Initiation", "Screening", etc.
    pub order: i32, // Sequence: 1, 2, 3...
    pub required_fields: Vec<String>, // Fields that must be filled before advancing
    pub stage_type: Option<String>, // "parallel", "sequential" (for approval workflows)
    pub approvers: Option<Vec<String>>, // Roles or Users (for approval workflows)
}

impl Blueprint {
    /// Generates the SQL CREATE TABLE statement for this blueprint
    pub fn to_sql(&self) -> String {
        let mut sql = format!("CREATE TABLE IF NOT EXISTS {} (\n", self.name);
        sql.push_str("    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n");
        
        for field in &self.fields {
            let sql_type = match field.field_type {
                SimpleFieldType::Text => "TEXT",
                SimpleFieldType::Number => "DOUBLE PRECISION",
                SimpleFieldType::Boolean => "BOOLEAN",
                SimpleFieldType::DateTime => "TIMESTAMPTZ",
                SimpleFieldType::Enum => "TEXT", 
                SimpleFieldType::Link => "UUID", 
                SimpleFieldType::Json => "JSONB",
            };

            let constraint = if field.required { "NOT NULL" } else { "" };
            sql.push_str(&format!("    {} {} {},\n", field.name, sql_type, constraint));
        }

        sql.push_str("    created_at TIMESTAMPTZ DEFAULT NOW(),\n");
        sql.push_str("    updated_at TIMESTAMPTZ DEFAULT NOW()\n");
        sql.push_str(");");
        sql
    }
}
