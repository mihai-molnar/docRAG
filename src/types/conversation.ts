import type { ChatMessage } from "./chat";

export interface Conversation {
  id: string;
  folderPath: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
