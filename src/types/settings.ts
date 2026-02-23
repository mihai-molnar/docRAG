export interface AppSettings {
  apiKey: string;
  chatModel: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  temperature: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "",
  chatModel: "gpt-4o-mini",
  embeddingModel: "text-embedding-3-small",
  chunkSize: 512,
  chunkOverlap: 100,
  topK: 5,
  temperature: 0.1,
};

export const CHAT_MODELS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
];

export const EMBEDDING_MODELS = [
  "text-embedding-3-small",
  "text-embedding-3-large",
  "text-embedding-ada-002",
];
