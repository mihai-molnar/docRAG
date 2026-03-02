import type { FileEntry, TextChunk } from "../types/documents";
import type { VectorEntry, PersistedIndex } from "../types/vectorStore";
import type { AppSettings } from "../types/settings";
import { scanFolder, readFileBytes, saveIndex, loadIndex, deleteIndex } from "./tauriCommands";
import { parseDocument } from "./documentParser";
import { chunkDocument } from "./chunker";
import { ollamaEmbed, OLLAMA_EMBED_MODEL } from "./openaiClient";
import { vectorStore } from "./vectorStore";
import { INDEX_VERSION } from "../lib/constants";

export interface IndexProgress {
  phase: "scanning" | "parsing" | "embedding" | "saving" | "done";
  currentFile?: string;
  filesProcessed: number;
  filesTotal: number;
}

export interface IndexDiff {
  added: FileEntry[];
  removed: string[];
  changed: FileEntry[];
  unchanged: string[];
}

export function computeIndexDiff(
  currentFiles: FileEntry[],
  existingIndex: PersistedIndex | null
): IndexDiff {
  if (!existingIndex) {
    return {
      added: currentFiles,
      removed: [],
      changed: [],
      unchanged: [],
    };
  }

  const existingMap = new Map(
    existingIndex.files.map((f) => [f.path, f.hash])
  );
  const currentMap = new Map(currentFiles.map((f) => [f.path, f]));

  const added: FileEntry[] = [];
  const changed: FileEntry[] = [];
  const unchanged: string[] = [];

  for (const file of currentFiles) {
    const existingHash = existingMap.get(file.path);
    if (!existingHash) {
      added.push(file);
    } else if (existingHash !== file.hash) {
      changed.push(file);
    } else {
      unchanged.push(file.path);
    }
  }

  const removed = existingIndex.files
    .filter((f) => !currentMap.has(f.path))
    .map((f) => f.path);

  return { added, removed, changed, unchanged };
}

async function processFiles(
  files: FileEntry[],
  settings: AppSettings,
  onProgress: (progress: IndexProgress) => void,
  startIndex: number,
  totalFiles: number
): Promise<VectorEntry[]> {
  const allChunks: TextChunk[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress({
      phase: "parsing",
      currentFile: file.name,
      filesProcessed: startIndex + i,
      filesTotal: totalFiles,
    });

    const bytesArray = await readFileBytes(file.path);
    const bytes = new Uint8Array(bytesArray);
    const result = await parseDocument(bytes, file.extension);
    const chunks = chunkDocument(
      result.text,
      file.path,
      file.name,
      settings.chunkSize,
      settings.chunkOverlap,
      result.pages
    );
    allChunks.push(...chunks);
  }

  if (allChunks.length === 0) return [];

  onProgress({
    phase: "embedding",
    filesProcessed: startIndex + files.length,
    filesTotal: totalFiles,
  });

  const embeddings = await ollamaEmbed(allChunks.map((c) => c.content));

  return allChunks.map((chunk, i) => ({
    id: chunk.id,
    documentPath: chunk.documentPath,
    documentName: chunk.documentName,
    content: chunk.content,
    chunkIndex: chunk.chunkIndex,
    pageNumber: chunk.pageNumber,
    embedding: embeddings[i],
  }));
}

export async function buildIndex(
  folderPath: string,
  settings: AppSettings,
  onProgress: (progress: IndexProgress) => void
): Promise<PersistedIndex> {
  onProgress({ phase: "scanning", filesProcessed: 0, filesTotal: 0 });

  const currentFiles = await scanFolder(folderPath);
  const existingJson = await loadIndex();
  let existingIndex: PersistedIndex | null = null;

  if (existingJson) {
    try {
      existingIndex = JSON.parse(existingJson);
    } catch {
      existingIndex = null;
    }
  }

  // Force full re-index if embedding model or chunk settings changed
  if (
    existingIndex &&
    (existingIndex.embeddingModel !== OLLAMA_EMBED_MODEL ||
      existingIndex.chunkSize !== settings.chunkSize ||
      existingIndex.chunkOverlap !== settings.chunkOverlap ||
      existingIndex.folderPath !== folderPath)
  ) {
    existingIndex = null;
  }

  const diff = computeIndexDiff(currentFiles, existingIndex);
  const filesToProcess = [...diff.added, ...diff.changed];
  const totalFiles = filesToProcess.length;

  // Remove deleted and changed docs from vector store
  for (const path of diff.removed) {
    vectorStore.removeByDocumentPath(path);
  }
  for (const file of diff.changed) {
    vectorStore.removeByDocumentPath(file.path);
  }

  // If full re-index (no existing), clear everything
  if (!existingIndex) {
    vectorStore.clear();
  }

  const newVectors = await processFiles(
    filesToProcess,
    settings,
    onProgress,
    0,
    totalFiles
  );

  vectorStore.addEntries(newVectors);

  onProgress({ phase: "saving", filesProcessed: totalFiles, filesTotal: totalFiles });

  const now = new Date().toISOString();
  const index: PersistedIndex = {
    version: INDEX_VERSION,
    embeddingModel: OLLAMA_EMBED_MODEL,
    chunkSize: settings.chunkSize,
    chunkOverlap: settings.chunkOverlap,
    folderPath,
    files: currentFiles.map((f) => ({
      path: f.path,
      name: f.name,
      hash: f.hash,
      chunkCount: vectorStore
        .getEntries()
        .filter((v) => v.documentPath === f.path).length,
    })),
    vectors: vectorStore.getEntries(),
    createdAt: existingIndex?.createdAt || now,
    updatedAt: now,
  };

  await saveIndex(JSON.stringify(index));

  onProgress({ phase: "done", filesProcessed: totalFiles, filesTotal: totalFiles });

  return index;
}

export async function restoreIndex(): Promise<PersistedIndex | null> {
  const json = await loadIndex();
  if (!json) return null;

  try {
    const index: PersistedIndex = JSON.parse(json);

    // Detect incompatible index (e.g. old OpenAI embeddings with different dimensions)
    if (index.embeddingModel !== OLLAMA_EMBED_MODEL) {
      await deleteIndex();
      return null;
    }

    vectorStore.setEntries(index.vectors);
    return index;
  } catch {
    return null;
  }
}
