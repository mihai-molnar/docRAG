use crate::models::FileEntry;
use sha2::{Digest, Sha256};
use std::fs;
use walkdir::WalkDir;

const SUPPORTED_EXTENSIONS: &[&str] = &["pdf", "docx", "pptx"];

#[tauri::command]
pub fn scan_folder(path: String) -> Result<Vec<FileEntry>, String> {
    let mut entries = Vec::new();

    for entry in WalkDir::new(&path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let file_path = entry.path();
        if !file_path.is_file() {
            continue;
        }

        let ext = file_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        if !SUPPORTED_EXTENSIONS.contains(&ext.as_str()) {
            continue;
        }

        let metadata = fs::metadata(file_path).map_err(|e| e.to_string())?;
        let bytes = fs::read(file_path).map_err(|e| e.to_string())?;

        let mut hasher = Sha256::new();
        hasher.update(&bytes);
        let hash = hex::encode(hasher.finalize());

        entries.push(FileEntry {
            path: file_path.to_string_lossy().to_string(),
            name: file_path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
            extension: ext,
            hash,
            size: metadata.len(),
        });
    }

    entries.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(entries)
}

#[tauri::command]
pub fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| format!("Failed to read {}: {}", path, e))
}

#[tauri::command]
pub fn hash_file(path: String) -> Result<String, String> {
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    Ok(hex::encode(hasher.finalize()))
}
