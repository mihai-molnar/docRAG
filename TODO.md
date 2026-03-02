# TODO

## Completed
- [x] Project scaffold (Tauri v2 + React + TS + Vite + Tailwind)
- [x] Rust backend commands (scan_folder, read_file_bytes, hash_file, save/load/delete_index)
- [x] Document parsing (PDF via pdfjs-dist, DOCX via mammoth, PPTX via JSZip)
- [x] Chunker with configurable size/overlap and page number tracking for PDFs
- [x] OpenAI client (batch embeddings + streaming chat completions)
- [x] In-memory vector store with cosine similarity search, persisted as JSON
- [x] Index manager with incremental re-indexing (add/remove/change detection via SHA-256)
- [x] Zustand store + hooks (useSettings, useIndex, useChat)
- [x] Settings view (API key, chat/embedding model, chunk size, overlap, top-K, temperature)
- [x] Documents view (folder picker, index/re-index, document list with chunk counts, progress bar)
- [x] Chat view (streaming responses, expandable source citations, open file in default app)
- [x] Sources shown after response completes, hidden when model says info not found
- [x] Settings loaded on app startup (not just when visiting Settings tab)
- [x] Chat scroll fix
- [x] Security hardening: CSP, Rust path validation, narrowed opener scope, error sanitization
- [x] @Document mention autocomplete: type `@` in chat to filter/select indexed documents, scopes vector search to mentioned docs only
- [x] Source citations deduped by document (best chunk per doc), colored file-type icons
- [x] Help tooltips on all settings fields

- [x] Rename DocRAG → Inkling + new quill pen nib app icon
- [x] Supabase auth (email/password sign-up/sign-in, session persistence, auth gating)
- [x] Free tier prompt limit (5 prompts, server-side enforcement via Supabase RPC, UI counter + warnings)

## Remaining
- [ ] Scale indexing to 5,000+ pages (see [docs/SCALE_PLAN.md](docs/SCALE_PLAN.md))
- [ ] Phase 2: Stripe integration for paid plans (unlimited prompts)
- [ ] Error handling polish: user-friendly messages for invalid API key (401), network errors, parse failures; skip broken files during indexing instead of aborting
- [ ] Final build verification and end-to-end testing
