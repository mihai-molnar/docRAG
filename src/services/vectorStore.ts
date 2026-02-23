import type { VectorEntry, SearchResult } from "../types/vectorStore";
import { dotProduct } from "../lib/cosine";

export class VectorStore {
  private entries: VectorEntry[] = [];

  getEntries(): VectorEntry[] {
    return this.entries;
  }

  setEntries(entries: VectorEntry[]) {
    this.entries = entries;
  }

  addEntries(entries: VectorEntry[]) {
    this.entries.push(...entries);
  }

  removeByDocumentPath(path: string) {
    this.entries = this.entries.filter((e) => e.documentPath !== path);
  }

  clear() {
    this.entries = [];
  }

  search(queryEmbedding: number[], topK: number): SearchResult[] {
    const scored = this.entries.map((entry) => ({
      entry,
      score: dotProduct(queryEmbedding, entry.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  get size(): number {
    return this.entries.length;
  }
}

export const vectorStore = new VectorStore();
