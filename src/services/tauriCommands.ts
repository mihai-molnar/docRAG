import { invoke } from "@tauri-apps/api/core";
import type { FileEntry } from "../types/documents";

export async function scanFolder(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("scan_folder", { path });
}

export async function readFileBytes(path: string): Promise<number[]> {
  return invoke<number[]>("read_file_bytes", { path });
}

export async function hashFile(path: string): Promise<string> {
  return invoke<string>("hash_file", { path });
}

export async function saveIndex(json: string): Promise<void> {
  return invoke("save_index", { json });
}

export async function loadIndex(): Promise<string | null> {
  return invoke<string | null>("load_index");
}

export async function deleteIndex(): Promise<void> {
  return invoke("delete_index");
}
