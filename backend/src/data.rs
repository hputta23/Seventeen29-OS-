use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Blueprint {
    pub name: String,
    pub fields: Vec<Field>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Field {
    pub name: String,
    #[serde(rename = "type")]
    pub field_type: SimpleFieldType,
    #[serde(default)]
    pub required: bool,
    
    // Extra properties for specific types
    pub options: Option<Vec<String>>, // For Enum
    pub target_blueprint: Option<String>, // For Link
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
