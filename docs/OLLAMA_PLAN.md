# Ollama Local Embeddings Support

## Goal

Replace OpenAI embeddings with local Ollama embeddings while keeping OpenAI for chat completions. This eliminates embedding API costs (the bulk of OpenAI usage) while maintaining chat quality.

## Why Not Fully Local

Ollama chat models (e.g. llama3.2) are slower and less capable than GPT-4o-mini on typical hardware. The hybrid approach — local embeddings, cloud chat — gives the best cost/quality tradeoff.

## Why Not Provider Toggle

A user-facing "OpenAI vs Ollama" toggle for each function (embed, chat) adds complexity and confusion. Instead, keep it simple:

- **Embeddings:** always Ollama (local, free)
- **Chat:** always OpenAI (fast, high quality)
- User only needs an OpenAI API key for chat — no embedding costs

## Embedding Model

**`nomic-embed-text`** (Ollama)
- 768 dimensions (vs 1536 for OpenAI `text-embedding-3-small`)
- Good retrieval quality for document Q&A
- Runs well on Apple Silicon (M1+)

**Important:** Switching from OpenAI to Ollama embeddings requires re-indexing all documents. The vector dimensions and spaces are incompatible.

## Prerequisites

- Ollama installed and running (`brew install ollama && ollama serve`)
- Model pulled: `ollama pull nomic-embed-text`
- Ollama serves at `http://localhost:11434`

## Implementation Plan

### 1. Update CSP (`src-tauri/capabilities/default.json`)

Add `http://localhost:11434` to the connect-src directive so the WebView can reach Ollama.

### 2. Add Ollama embed function (`src/services/openaiClient.ts`)

Add a new `batchEmbedOllama()` function hitting `http://localhost:11434/v1/embeddings` (OpenAI-compatible endpoint). No auth header needed. Use `nomic-embed-text` as the model.

Replace existing `batchEmbed` calls in the indexing and query paths with the Ollama version.

### 3. Update settings (`src/types/settings.ts`)

- Remove `embeddingModel` from user-facing settings (hardcoded to `nomic-embed-text` via Ollama)
- Keep `chatModel` and `apiKey` (still needed for OpenAI chat)
- Remove embedding model selector from Settings UI

### 4. Update `src/services/indexManager.ts`

The index currently stores which embedding model was used. Update to reference the Ollama model. Detect model mismatch on restore and prompt re-index.

### 5. Update `src/components/settings/SettingsView.tsx`

- Remove embedding model selector
- Add an Ollama status indicator (check `http://localhost:11434/api/tags` on load)
- Show helpful error if Ollama isn't running

### 6. Handle Ollama not running

If Ollama is unreachable:
- Indexing: show clear error "Ollama is not running. Install it with `brew install ollama` and run `ollama serve`."
- Chat query embedding: same error, but don't block the UI
- Don't fall back to OpenAI silently — be explicit

### 7. Vector dimension migration

Existing indexes use 1536-dim OpenAI vectors. On first launch after this change:
- Detect dimension mismatch in persisted index
- Show a one-time prompt: "Embeddings have changed. Please re-index your documents."
- Clear the old index

## Files to Modify

- `src-tauri/capabilities/default.json` — CSP
- `src/services/openaiClient.ts` — add Ollama embed function
- `src/services/indexManager.ts` — use Ollama for embeddings
- `src/hooks/useChat.ts` — use Ollama for query embedding
- `src/types/settings.ts` — remove embeddingModel from settings
- `src/components/settings/SettingsView.tsx` — remove embed model selector, add Ollama status
- `src/components/settings/ModelSelector.tsx` — simplify (chat models only)

## What Stays the Same

- `streamChatCompletion` — still hits OpenAI
- Chat quality — same models, same prompts
- Conversation history, auth, all UI — untouched
- Rust backend — no changes

## Cost Impact

- **Before:** OpenAI charges for embeddings (~$0.02/1M tokens) + chat
- **After:** Embeddings free (local), only pay for chat completions
- For a 5,000-page corpus: saves ~$0.50–1.00 per full re-index

## Risks

- **Retrieval quality:** `nomic-embed-text` is slightly below OpenAI's embedding models. For straightforward document Q&A this is negligible.
- **Hardware dependency:** Embedding speed depends on the user's machine. Apple Silicon M1+ handles it well; older Intel Macs will be slower.
- **Extra install step:** Users must install Ollama separately. Need clear onboarding UX.
