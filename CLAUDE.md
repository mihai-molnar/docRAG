# DocRAG — Development Guide

## Project Overview
Desktop RAG app: select a folder of documents (PDF, DOCX, PPTX), index them into embeddings, and chat with an AI that answers from those documents only.

## Tech Stack
- **Tauri v2** (Rust backend) + **React 18 + TypeScript** (frontend in WebView)
- **Tailwind CSS v4** + **lucide-react** (styling/icons)
- **Zustand** (state management)
- **OpenAI API** (embeddings + chat), configurable models
- **In-memory vector store** persisted as JSON

## Architecture
- React runs in a WebView (browser context, NOT Node.js). All npm packages must be browser-compatible.
- Rust handles all filesystem operations via Tauri IPC commands.
- `AllowedFolder` managed state in Rust restricts file access to the user-selected folder.

## Key Commands
```bash
npm run dev          # Start Vite dev server only
npx tauri dev        # Start full app (Rust + frontend with HMR)
npx tauri build      # Production build (.app + .dmg)
npx tsc --noEmit     # TypeScript type check
cargo check          # Rust type check (run from src-tauri/)
```

## Important Notes
- Frontend changes hot-reload via Vite — no restart needed
- Rust changes require restarting `npx tauri dev`
- CSP is enabled and restrictive — only `https://api.openai.com` for fetch, `blob:` for pdf.js worker
- Opener plugin scoped to `$HOME/**/*.{pdf,docx,pptx}` only
- API key stored via `tauri-plugin-store` in OS app data dir (not in repo)
- Error messages are sanitized to strip API key patterns before display

## Project Structure
```
src/
  types/          — TypeScript interfaces (documents, vectorStore, chat, settings)
  services/       — tauriCommands, documentParser, chunker, openaiClient, vectorStore, indexManager
  hooks/          — useSettings, useIndex, useChat
  components/
    layout/       — AppLayout, Sidebar
    chat/         — ChatView, MessageBubble, ChatInput, SourceChips
    documents/    — DocumentsView, FolderPicker, DocumentList, IndexingProgress
    settings/     — SettingsView, ApiKeyInput, ModelSelector
  lib/            — cosine, pptxParser, constants
  store/          — appStore (Zustand)
src-tauri/
  src/commands/   — filesystem.rs (scan, read, hash with path validation), persistence.rs (index save/load)
  src/            — lib.rs (plugin + command registration), models.rs
  capabilities/   — default.json (permissions)
```
