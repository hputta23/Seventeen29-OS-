use crate::graph_service::GraphService;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgPool;
use anyhow::Result;

pub struct AiService;

#[derive(Serialize, Deserialize)]
pub struct OllamaRequest {
    pub model: String,
    pub prompt: String,
    pub stream: bool,
}

#[derive(Serialize, Deserialize)]
pub struct OllamaResponse {
    pub response: String,
}

impl AiService {
    /// Performs "Agentic Root Cause Analysis" using a local LLM (Privacy-First).
    /// 1. Retrieves context from Graph (simulated RAG).
    /// 2. Prompts Ollama (Llama 3 / Mistral) for "5-Whys".
    pub async fn analyze_root_cause(_pool: &PgPool, description: &str) -> Result<String> {
        // 1. RAG Simulation: Retrieve similar past incidents (Mocked)
        // In production, we'd query Qdrant here.
        let similar_incidents = "
        - Incident #123: Forklift buffer failure due to lack of maintenance.
        - Incident #456: Hydraulic leak caused slippery floor.
        ";

        // 2. Construct Prompt
        let system_prompt = "You are a Senior Safety Investigator. Use the '5-Whys' method to find the root cause.";
        let final_prompt = format!(
            "{}\n\nContext from similar incidents:\n{}\n\nCurrent Incident: {}\n\nProvide a 5-Why analysis.",
            system_prompt, similar_incidents, description
        );

        // 3. Call Ollama (Localhost)
        let client = reqwest::Client::new();
        let res = client.post("http://localhost:11434/api/generate")
            .json(&json!({
                "model": "mistral", // or "llama3"
                "prompt": final_prompt,
                "stream": false
            }))
            .send()
            .await;

        match res {
            Ok(response) => {
                if response.status().is_success() {
                    let ollama_res: OllamaResponse = response.json().await?;
                    Ok(ollama_res.response)
                } else {
                     // Fallback if Ollama is down (Graceful degradation)
                    Ok("AI Agent Unavailable. Please perfom manual RCA.".to_string())
                }
            },
            Err(_) => {
                // Fallback for demo if Ollama isn't running
                 Ok("AI Agent Offline (Ollama not detected). \n\nSuggested 5-Why:\n1. Why did the incident happen? [User Input Needed]\n2. ...".to_string())
            }
        }
    }
}
