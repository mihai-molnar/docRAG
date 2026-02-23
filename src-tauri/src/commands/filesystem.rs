use crate::models::FileEntry;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use walkdir::WalkDir;

const SUPPORTED_EXTENSIONS: &[&str] = &["pdf", "docx", "pptx"];

/// Tracks the currently allowed folder path for file operations.
pub struct AllowedFolder(pub Mutex<Option<PathBuf>>);

fn is_path_within(path: &PathBuf, parent: &PathBuf) -> bool {
    match (path.canonicalize(), parent.canonicalize()) {
        (Ok(canonical_path), Ok(canonical_parent)) => {
            canonical_path.starts_with(&canonical_parent)
        }
        _ => false,
    }
}

fn validate_path(path: &str, allowed: &AllowedFolder) -> Result<PathBuf, String> {
    let path_buf = PathBuf::from(path);
    let guard = allowed.0.lock().map_err(|e| e.to_string())?;
    let folder = guard
        .as_ref()
        .ok_or("No folder selected. Please select a document folder first.")?;

    if !is_path_within(&path_buf, folder) {
        return Err("Access denied: path is outside the allowed folder.".to_string());
    }
    Ok(path_buf)
}

#[tauri::command]
pub fn scan_folder(
    path: String,
    state: tauri::State<'_, AllowedFolder>,
) -> Result<Vec<FileEntry>, String> {
    let folder = PathBuf::from(&path);
    if !folder.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    // Set this folder as the allowed root for subsequent file reads
    {
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        *guard = Some(folder.canonicalize().map_err(|e| e.to_string())?);
    }

    let mut entries = Vec::new();

    for entry in WalkDir::new(&path)
        .follow_links(false)
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
pub fn read_file_bytes(
    path: String,
    state: tauri::State<'_, AllowedFolder>,
) -> Result<Vec<u8>, String> {
    let validated = validate_path(&path, &state)?;
    fs::read(&validated).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub fn hash_file(
    path: String,
    state: tauri::State<'_, AllowedFolder>,
) -> Result<String, String> {
    let validated = validate_path(&path, &state)?;
    let bytes = fs::read(&validated).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    Ok(hex::encode(hasher.finalize()))
}
