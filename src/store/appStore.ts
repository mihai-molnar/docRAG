import { create } from "zustand";
import type { PersistedIndex } from "../types/vectorStore";
import type { ChatMessage } from "../types/chat";
import type { AppSettings } from "../types/settings";
import { DEFAULT_SETTINGS } from "../types/settings";
import type { IndexProgress } from "../services/indexManager";

export type ActiveView = "chat" | "documents" | "settings";

interface AppState {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;

  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => void;

  index: PersistedIndex | null;
  setIndex: (index: PersistedIndex | null) => void;

  folderPath: string | null;
  setFolderPath: (path: string | null) => void;

  indexing: boolean;
  setIndexing: (indexing: boolean) => void;

  indexProgress: IndexProgress | null;
  setIndexProgress: (progress: IndexProgress | null) => void;

  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  clearMessages: () => void;

  streaming: boolean;
  setStreaming: (streaming: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: "chat",
  setActiveView: (view) => set({ activeView: view }),

  settings: DEFAULT_SETTINGS,
  setSettings: (settings) => set({ settings }),
  updateSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),

  index: null,
  setIndex: (index) => set({ index }),

  folderPath: null,
  setFolderPath: (path) => set({ folderPath: path }),

  indexing: false,
  setIndexing: (indexing) => set({ indexing }),

  indexProgress: null,
  setIndexProgress: (progress) => set({ indexProgress: progress }),

  messages: [],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateLastAssistantMessage: (content) =>
    set((state) => {
      const msgs = [...state.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "assistant") {
          msgs[i] = { ...msgs[i], content };
          break;
        }
      }
      return { messages: msgs };
    }),
  clearMessages: () => set({ messages: [] }),

  streaming: false,
  setStreaming: (streaming) => set({ streaming }),
}));
