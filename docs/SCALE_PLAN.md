# Scaling Indexing to 5,000+ Pages

## Current Limits

With the current implementation, ~1,000 total pages is the safe upper bound. Beyond that:
- OpenAI 429 rate limits crash the indexing run (no retry logic)
- A failure at any point loses all progress (no checkpointing)
- Persisted JSON index grows to 600MB–1GB (floats as text)
- ~450MB in-memory for embedding vectors (Float64)
- Sequential embedding batches underutilize API throughput
- PDF parsing blocks the main thread, freezing the UI

## Target

Support ~5,000 pages (~30,000–36,000 chunks) without crashes, with reasonable indexing time (~5–10 min) and a responsive UI.

## Implementation Plan

### P0 — Must-Have (currently broken at scale)

#### 1. Retry with exponential backoff on 429s
**File:** `src/services/openaiClient.ts`

Wrap the `fetch` call in `batchEmbed` with a retry loop:
- On 429 or 5xx, wait and retry (exponential backoff: 1s, 2s, 4s, max 3–5 retries)
- Read `Retry-After` header from 429 responses when available
- Throw after max retries exhausted

#### 2. Incremental checkpointing
**Files:** `src/services/indexManager.ts`, `src/services/tauriCommands.ts`

Instead of processing all files then saving once at the end:
- Process files in batches (e.g. 10–20 files at a time)
- After each batch: embed, add to vector store, save a checkpoint
- On resume: load checkpoint, compute diff against it, skip already-processed files
- Requires a `partial` flag or separate checkpoint file so we don't confuse a partial index with a complete one

#### 3. Binary or compressed index format
**Files:** `src/services/indexManager.ts`, `src/services/tauriCommands.ts`, `src-tauri/src/commands/persistence.rs`

Options (pick one):
- **Option A — Gzip JSON:** Compress with `CompressionStream` API before saving, decompress on load. Simplest change, ~5–10x smaller files. Browser `CompressionStream` is available in WebView.
- **Option B — Binary embeddings:** Store embeddings as a separate `Float32Array` binary blob, keep metadata as JSON. More complex but most efficient (~200MB for 36k vectors).

Recommendation: Start with Option A (gzip). Move to Option B only if load times are still too slow.

### P1 — Should-Have (noticeable performance improvement)

#### 4. Parallel embedding batches
**File:** `src/services/openaiClient.ts`

Replace the sequential `for` loop in `batchEmbed` with a concurrency-limited parallel approach:
- Fire N concurrent batch requests (e.g. N=3–5)
- Use a semaphore or `Promise.allSettled` with a pool
- Respects rate limits while cutting embedding time by 3–5x
- Combine with P0.1 retry logic per-request

#### 5. Web Worker for PDF parsing
**Files:** New worker file, `src/services/documentParser.ts`

- Move `pdfjs-dist` parsing into a dedicated Web Worker
- Main thread sends file bytes, worker returns parsed text + page spans
- Keeps UI responsive during the parsing phase
- Note: `pdfjs` already supports worker mode for its internal operations, but the parsing loop itself still runs on the calling thread

#### 6. Float32 embeddings
**Files:** `src/services/openaiClient.ts`, `src/services/vectorStore.ts`, `src/lib/cosine.ts`

- OpenAI returns Float64 (JS numbers) but embedding precision doesn't need it
- Store as `Float32Array` instead of `number[]` — halves memory (~220MB vs ~450MB)
- Update `dotProduct` to work with `Float32Array`
- Pairs well with P0.3 Option B (binary format)

### P2 — Nice-to-Have (matters at even larger scale)

#### 7. Approximate nearest neighbor search
**File:** `src/services/vectorStore.ts`

- Current linear scan is still fast at 36k vectors (~10–20ms)
- Would matter at 50k+ vectors
- Options: HNSW via a WASM library, or move search to Rust side
- Not needed for the 5k page target

#### 8. Streaming/chunked index loading
**Files:** `src/services/indexManager.ts`, Rust persistence commands

- A 200MB+ index takes a few seconds to load on startup
- Could lazy-load or memory-map from the Rust backend
- Low priority — only affects cold start time

## Estimated Effort

| Item | Effort |
|------|--------|
| P0.1 Retry/backoff | Small (1 file, ~30 lines) |
| P0.2 Checkpointing | Medium (indexManager refactor + new Tauri command) |
| P0.3 Compressed index | Small–Medium (depends on option chosen) |
| P1.4 Parallel batches | Small (openaiClient refactor) |
| P1.5 Web Worker parsing | Medium (new worker, message passing) |
| P1.6 Float32 embeddings | Small (type changes + cosine update) |
| P2.7 ANN search | Large (new dependency, API changes) |
| P2.8 Streaming load | Medium (Rust-side changes) |

P0 items alone would make 5,000 pages reliable. P1 items make it fast and smooth.
