import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import type { PersistedIndex } from "../types/vectorStore";
import type { ChatMessage } from "../types/chat";
import type { Conversation } from "../types/conversation";
import type { AppSettings } from "../types/settings";
import { DEFAULT_SETTINGS } from "../types/settings";
import type { IndexProgress } from "../services/indexManager";

export type ActiveView = "chat" | "documents" | "settings";

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  session: Session | null;
  setSession: (session: Session | null) => void;
  authLoading: boolean;
  setAuthLoading: (loading: boolean) => void;
  promptCount: number;
  setPromptCount: (count: number) => void;
  promptLimit: number;
  setPromptLimit: (limit: number) => void;

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

  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;

  streaming: boolean;
  setStreaming: (streaming: boolean) => void;

  ollamaReady: boolean;
  setOllamaReady: (ready: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  session: null,
  setSession: (session) => set({ session }),
  authLoading: true,
  setAuthLoading: (loading) => set({ authLoading: loading }),
  promptCount: 0,
  setPromptCount: (count) => set({ promptCount: count }),
  promptLimit: 5,
  setPromptLimit: (limit) => set({ promptLimit: limit }),

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

  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  conversations: [],
  setConversations: (conversations) => set({ conversations }),

  streaming: false,
  setStreaming: (streaming) => set({ streaming }),

  ollamaReady: false,
  setOllamaReady: (ready) => set({ ollamaReady: ready }),
}));
