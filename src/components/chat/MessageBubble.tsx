import { User, Bot } from "lucide-react";
import type { ChatMessage } from "../../types/chat";
import { SourceChips } from "./SourceChips";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
          <Bot size={16} />
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-indigo-600 text-white rounded-br-md"
              : "bg-zinc-800 text-zinc-100 rounded-bl-md"
          }`}
        >
          {message.content || (
            <span className="inline-block w-2 h-4 bg-zinc-500 animate-pulse rounded-sm" />
          )}
        </div>
        {!isUser && message.sources && (
          <SourceChips sources={message.sources} />
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
          <User size={16} />
        </div>
      )}
    </div>
  );
}
