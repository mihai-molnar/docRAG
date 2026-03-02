import { load } from "@tauri-apps/plugin-store";
import { useAppStore } from "../store/appStore";
import type { Conversation } from "../types/conversation";

const STORE_NAME = "conversations.json";

let storePromise: ReturnType<typeof load> | null = null;

function getStore() {
  if (!storePromise) {
    storePromise = load(STORE_NAME);
  }
  return storePromise;
}

function storeKey(): string | null {
  const userId = useAppStore.getState().user?.id;
  if (!userId) return null;
  return `conversations:${userId}`;
}

export async function loadConversations() {
  const key = storeKey();
  if (!key) return;
  const store = await getStore();
  const saved = await store.get<Conversation[]>(key);
  useAppStore.getState().setConversations(saved ?? []);
}

export async function saveActiveConversation() {
  const key = storeKey();
  if (!key) return;

  const { messages, activeConversationId, conversations, folderPath } =
    useAppStore.getState();

  // Don't persist empty conversations
  if (messages.length === 0 || !folderPath) return;

  const now = Date.now();
  const firstUserMsg = messages.find((m) => m.role === "user");
  const title = firstUserMsg
    ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? "..." : "")
    : "New conversation";

  let updated: Conversation[];
  let newActiveId = activeConversationId;

  if (activeConversationId) {
    // Update existing
    updated = conversations.map((c) =>
      c.id === activeConversationId
        ? { ...c, messages, title, updatedAt: now }
        : c
    );
  } else {
    // Create new
    const id = crypto.randomUUID();
    newActiveId = id;
    const conv: Conversation = {
      id,
      folderPath,
      title,
      messages,
      createdAt: now,
      updatedAt: now,
    };
    updated = [conv, ...conversations];
  }

  useAppStore.getState().setConversations(updated);
  useAppStore.getState().setActiveConversationId(newActiveId);

  const store = await getStore();
  await store.set(key, updated);
  await store.save();
}

export function clearConversationState() {
  useAppStore.getState().setConversations([]);
  useAppStore.getState().setActiveConversationId(null);
  useAppStore.getState().clearMessages();
}

export function useConversations() {
  const folderPath = useAppStore((s) => s.folderPath);
  const conversations = useAppStore((s) => s.conversations);
  const activeConversationId = useAppStore((s) => s.activeConversationId);

  const folderConversations = conversations
    .filter((c) => c.folderPath === folderPath)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const switchConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    useAppStore.setState({ messages: conv.messages, activeConversationId: id });
  };

  const newConversation = () => {
    useAppStore.setState({ messages: [], activeConversationId: null });
  };

  const deleteConversation = async (id: string) => {
    const key = storeKey();
    if (!key) return;

    const updated = conversations.filter((c) => c.id !== id);
    useAppStore.getState().setConversations(updated);

    // If deleting the active conversation, clear the chat
    if (activeConversationId === id) {
      useAppStore.setState({ messages: [], activeConversationId: null });
    }

    const store = await getStore();
    await store.set(key, updated);
    await store.save();
  };

  return {
    folderConversations,
    activeConversationId,
    switchConversation,
    newConversation,
    deleteConversation,
  };
}
