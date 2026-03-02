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

  searchFiltered(
    queryEmbedding: number[],
    topK: number,
    documentNames: string[]
  ): SearchResult[] {
    const nameSet = new Set(documentNames.map((n) => n.toLowerCase()));
    const filtered = this.entries.filter((e) =>
      nameSet.has(e.documentName.toLowerCase())
    );

    const scored = filtered.map((entry) => ({
      entry,
      score: dotProduct(queryEmbedding, entry.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  spreadSample(documentNames: string[], count: number): VectorEntry[] {
    const nameSet = new Set(documentNames.map((n) => n.toLowerCase()));
    const filtered = this.entries
      .filter((e) => nameSet.has(e.documentName.toLowerCase()))
      .sort((a, b) => a.chunkIndex - b.chunkIndex);

    if (filtered.length <= count) return filtered;

    const step = filtered.length / count;
    const sampled: VectorEntry[] = [];
    for (let i = 0; i < count; i++) {
      sampled.push(filtered[Math.floor(i * step)]);
    }
    return sampled;
  }

  get size(): number {
    return this.entries.length;
  }
}

export const vectorStore = new VectorStore();
