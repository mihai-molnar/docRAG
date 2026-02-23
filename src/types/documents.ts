export interface FileEntry {
  path: string;
  name: string;
  extension: string;
  hash: string;
  size: number;
}

export interface PageSpan {
  pageNumber: number;
  startOffset: number;
}

export interface ParseResult {
  text: string;
  pages?: PageSpan[];
}

export interface TextChunk {
  id: string;
  documentPath: string;
  documentName: string;
  content: string;
  chunkIndex: number;
  pageNumber?: number;
}
