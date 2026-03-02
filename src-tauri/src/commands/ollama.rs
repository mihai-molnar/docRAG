use std::path::Path;
use std::process::Command;

/// Find the ollama binary. On macOS it may not be on PATH until the app
/// has been launched once, so check well-known locations too.
fn find_ollama() -> Option<String> {
    // 1. Try PATH first
    if Command::new("ollama")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        return Some("ollama".to_string());
    }

    // 2. Check common macOS install locations
    let candidates = [
        "/usr/local/bin/ollama",
        "/opt/homebrew/bin/ollama",
    ];
    for path in candidates {
        if Path::new(path).exists() {
            return Some(path.to_string());
        }
    }

    // 3. Check if the .app bundle exists (installed but never launched)
    if Path::new("/Applications/Ollama.app").exists() {
        return Some("app_bundle".to_string());
    }

    None
}

#[tauri::command]
pub fn check_ollama_installed() -> bool {
    find_ollama().is_some()
}

#[tauri::command]
pub fn start_ollama_serve() -> Result<(), String> {
    use std::process::Stdio;

    let ollama = find_ollama().ok_or("Ollama is not installed")?;

    if ollama == "app_bundle" {
        // Launch the macOS app, which starts the server and installs the CLI
        Command::new("open")
            .arg("-a")
            .arg("Ollama")
            .spawn()
            .map_err(|e| format!("Failed to launch Ollama.app: {}", e))?;
    } else {
        Command::new(&ollama)
            .arg("serve")
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("Failed to start ollama serve: {}", e))?;
    }

    Ok(())
}
