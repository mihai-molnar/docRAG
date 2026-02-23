export interface VectorEntry {
  id: string;
  documentPath: string;
  documentName: string;
  content: string;
  chunkIndex: number;
  pageNumber?: number;
  embedding: number[];
}

export interface SearchResult {
  entry: VectorEntry;
  score: number;
}

export interface PersistedIndex {
  version: number;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  folderPath: string;
  files: Array<{
    path: string;
    name: string;
    hash: string;
    chunkCount: number;
  }>;
  vectors: VectorEntry[];
  createdAt: string;
  updatedAt: string;
}
