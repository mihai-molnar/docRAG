mod commands;
mod models;

use commands::filesystem::AllowedFolder;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AllowedFolder(Mutex::new(None)))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::filesystem::scan_folder,
            commands::filesystem::read_file_bytes,
            commands::filesystem::hash_file,
            commands::persistence::save_index,
            commands::persistence::load_index,
            commands::persistence::delete_index,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
