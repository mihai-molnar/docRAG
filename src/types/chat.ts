export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  timestamp: number;
}

export interface ChatSource {
  documentName: string;
  documentPath: string;
  chunkContent: string;
  score: number;
  pageNumber?: number;
}
