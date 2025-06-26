use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize)]
struct LLMRequest {
    base_url: String,
    api_key: Option<String>,
    model: String,
    messages: Vec<LLMMessage>,
    temperature: f32,
    max_tokens: u32,
}

#[derive(Serialize, Deserialize)]
struct LLMMessage {
    role: String,
    content: String,
}

#[derive(Serialize, Deserialize)]
struct LLMResponse {
    choices: Vec<LLMChoice>,
}

#[derive(Serialize, Deserialize)]
struct LLMChoice {
    message: LLMMessage,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn call_llm_api(request: LLMRequest) -> Result<LLMResponse, String> {
    let client = reqwest::Client::new();
    
    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert("Content-Type", "application/json".parse().unwrap());
    
    if let Some(api_key) = &request.api_key {
        if !api_key.is_empty() {
            let auth_header = format!("Bearer {}", api_key);
            headers.insert("Authorization", auth_header.parse().unwrap());
        }
    }

    let messages_json = serde_json::to_value(&request.messages)
        .map_err(|e| format!("Failed to serialize messages: {}", e))?;
    
    let mut request_body = HashMap::new();
    request_body.insert("model", serde_json::Value::String(request.model));
    request_body.insert("messages", messages_json);
    request_body.insert("temperature", serde_json::Value::Number(serde_json::Number::from_f64(request.temperature as f64).unwrap()));
    request_body.insert("max_tokens", serde_json::Value::Number(serde_json::Number::from(request.max_tokens)));

    let url = format!("{}/chat/completions", request.base_url);
    
    let response = client
        .post(&url)
        .headers(headers)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("LLM API error {}: {}", status, error_text));
    }

    let llm_response: LLMResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(llm_response)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, call_llm_api])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
