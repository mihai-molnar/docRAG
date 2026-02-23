use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn get_index_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    Ok(data_dir.join("index.json"))
}

#[tauri::command]
pub fn save_index(app: tauri::AppHandle, json: String) -> Result<(), String> {
    let path = get_index_path(&app)?;
    fs::write(&path, json).map_err(|e| format!("Failed to save index: {}", e))
}

#[tauri::command]
pub fn load_index(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = get_index_path(&app)?;
    if path.exists() {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        Ok(Some(content))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn delete_index(app: tauri::AppHandle) -> Result<(), String> {
    let path = get_index_path(&app)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
