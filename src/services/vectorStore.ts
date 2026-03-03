import type { VectorEntry, SearchResult } from "../types/vectorStore";
import { cosineSimilarity } from "../lib/cosine";

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
      score: cosineSimilarity(queryEmbedding, entry.embedding),
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
      score: cosineSimilarity(queryEmbedding, entry.embedding),
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

  /**
   * For each semantic result, include ±radius neighboring chunks from the
   * same document. This gives the LLM surrounding context around each hit.
   */
  expandWithNeighbors(
    results: SearchResult[],
    radius: number = 1
  ): SearchResult[] {
    // Build a lookup: docPath → chunkIndex → entry
    const docChunks = new Map<string, Map<number, VectorEntry>>();
    for (const e of this.entries) {
      let byIdx = docChunks.get(e.documentPath);
      if (!byIdx) {
        byIdx = new Map();
        docChunks.set(e.documentPath, byIdx);
      }
      byIdx.set(e.chunkIndex, e);
    }

    const seen = new Set<string>();
    const expanded: SearchResult[] = [];

    for (const r of results) {
      const byIdx = docChunks.get(r.entry.documentPath);
      if (!byIdx) continue;

      for (let offset = -radius; offset <= radius; offset++) {
        const idx = r.entry.chunkIndex + offset;
        const entry = byIdx.get(idx);
        if (entry && !seen.has(entry.id)) {
          seen.add(entry.id);
          expanded.push({
            entry,
            score: offset === 0 ? r.score : r.score * 0.5,
          });
        }
      }
    }

    return expanded;
  }

  get size(): number {
    return this.entries.length;
  }
}

export const vectorStore = new VectorStore();
