use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

// Shared Types Strategy: These structs will generate TypeScript interfaces
#[derive(Serialize, Deserialize, TS)]
#[ts(export)]
pub struct FieldDef {
    pub name: String,
    pub label: String,
    pub field_type: String, // "text", "number", "enum", etc.
    pub formula: Option<String>,
}

#[derive(Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ModuleBlueprint {
    pub name: String,
    pub fields: Vec<FieldDef>,
}

#[wasm_bindgen]
pub fn evaluate_formula(expression: &str, context_json: &str) -> Result<f64, String> {
    let context: std::collections::HashMap<String, f64> = serde_json::from_str(context_json)
        .map_err(|e| format!("Invalid context JSON: {}", e))?;

    let mut expr = meval::Context::new(); 
    
    for (key, value) in context {
        expr.var(key, value);
    }

    meval::eval_str_with_context(expression, &expr)
        .map_err(|e| format!("Calculation Error: {}", e))
}

#[derive(Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ValidationContext {
    pub existing_modules: Vec<String>, // Names of existing modules
    pub dependencies: std::collections::HashMap<String, Vec<String>>, // "Module A" -> ["Module B", "Module C"]
}

#[wasm_bindgen]
pub fn validate_blueprint(blueprint_json: &str, context_json: &str) -> Result<bool, String> {
    let blueprint: ModuleBlueprint = serde_json::from_str(blueprint_json)
        .map_err(|e| format!("Invalid Blueprint JSON: {}", e))?;

    let context: ValidationContext = serde_json::from_str(context_json)
        .map_err(|e| format!("Invalid Context JSON: {}", e))?;

    // 1. Basic Name Checks
    if blueprint.name.trim().is_empty() {
        return Err("Module name cannot be empty".to_string());
    }

    // 2. Field Checks & Stale Link Detection
    let mut names = std::collections::HashSet::new();
    let mut my_dependencies = Vec::new();

    for field in &blueprint.fields {
        // Reserved words
        if field.name == "id" || field.name == "created_at" {
            return Err(format!("Reserved field name used: {}", field.name));
        }

        // Duplicate check
        if names.contains(&field.name) {
            return Err(format!("Duplicate field name found: {}", field.name));
        }
        names.insert(field.name.clone());

        // Neural Link Check
        if field.field_type == "neural" {
            // Assuming the 'options' or 'formula' might contain the target module name for now.
            // For this phase, let's assume the inspector puts the target module in `formula` field for simplicity?
            // Or we should verify against `existing_modules`.
            if let Some(target_module) = &field.formula {
                 if !context.existing_modules.contains(target_module) {
                     return Err(format!("Stale Link: Target module '{}' does not exist.", target_module));
                 }
                 my_dependencies.push(target_module.clone());
            }
        }
    }

    // 3. Circular Dependency Check
    // Check if any of *my* dependencies eventually depend on *me*
    for dep in my_dependencies {
        if check_circular_dependency(&dep, &blueprint.name, &context.dependencies) {
            return Err(format!("Circular Dependency detected with module '{}'", dep));
        }
    }

    Ok(true)
}

fn check_circular_dependency(current: &str, target: &str, graph: &std::collections::HashMap<String, Vec<String>>) -> bool {
    if current == target {
        return true;
    }
    if let Some(neighbors) = graph.get(current) {
        for neighbor in neighbors {
            if check_circular_dependency(neighbor, target, graph) {
                return true;
            }
        }
    }
    false
}

#[derive(Serialize, Deserialize, TS)]
#[ts(export)]
pub struct IncidentData {
    pub medical_treatment: bool,
    pub loss_of_consciousness: bool,
    pub days_away: i32,
    pub restricted_days: i32,
    pub death: bool,
}

#[wasm_bindgen]
pub fn check_recordability(incident_json: &str) -> Result<bool, String> {
    let data: IncidentData = serde_json::from_str(incident_json)
        .map_err(|e| format!("Invalid Incident JSON: {}", e))?;

    // OSHA 1904.7 General Recording Criteria
    if data.death { return Ok(true); }
    if data.days_away > 0 { return Ok(true); }
    if data.restricted_days > 0 { return Ok(true); }
    if data.medical_treatment { return Ok(true); }
    if data.loss_of_consciousness { return Ok(true); }

    // Logic Note: First Aid does NOT trigger recordability.
    Ok(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_recordability_criteria() {
        // Case 1: First Aid (Not Recordable)
        let first_aid = r#"{
            "medical_treatment": false,
            "loss_of_consciousness": false,
            "days_away": 0,
            "restricted_days": 0,
            "death": false
        }"#;
        assert_eq!(check_recordability(first_aid), Ok(false));

        // Case 2: Medical Treatment (Recordable)
        let med_treat = r#"{
            "medical_treatment": true,
            "loss_of_consciousness": false,
            "days_away": 0,
            "restricted_days": 0,
            "death": false
        }"#;
        assert_eq!(check_recordability(med_treat), Ok(true));

        // Case 3: Restricted Work (Recordable)
        let restricted = r#"{
            "medical_treatment": false,
            "loss_of_consciousness": false,
            "days_away": 0,
            "restricted_days": 5,
            "death": false
        }"#;
        assert_eq!(check_recordability(restricted), Ok(true));
        
        // Case 4: Invalid JSON
        assert!(check_recordability(r#"{ "broken": true } "#).is_err());
    }
}
