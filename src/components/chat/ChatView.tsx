import { useEffect, useRef } from "react";
import { MessageSquare, FolderOpen, Trash2 } from "lucide-react";
import { useChat } from "../../hooks/useChat";
import { useAppStore } from "../../store/appStore";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";

const SUGGESTIONS = [
  "Summarize the key points from the documents",
  "What are the main topics covered?",
  "Find information about...",
];

export function ChatView() {
  const { messages, sendMessage, streaming, clearMessages } = useChat();
  const index = useAppStore((s) => s.index);
  const settings = useAppStore((s) => s.settings);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const hasApiKey = !!settings.apiKey;
  const hasIndex = !!index;

  if (!hasApiKey) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <MessageSquare size={48} className="mx-auto text-zinc-600 mb-4" />
          <h2 className="text-lg font-semibold text-zinc-300 mb-2">
            API Key Required
          </h2>
          <p className="text-sm text-zinc-500 mb-4">
            Set your OpenAI API key in Settings to get started.
          </p>
          <button
            onClick={() => setActiveView("settings")}
            className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500 transition-colors"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  if (!hasIndex) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <FolderOpen size={48} className="mx-auto text-zinc-600 mb-4" />
          <h2 className="text-lg font-semibold text-zinc-300 mb-2">
            No Documents Indexed
          </h2>
          <p className="text-sm text-zinc-500 mb-4">
            Select a folder and index your documents to start chatting.
          </p>
          <button
            onClick={() => setActiveView("documents")}
            className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500 transition-colors"
          >
            Go to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 shrink-0">
        <h2 className="text-sm font-medium text-zinc-300">
          Chat — {index.files.length} docs, {index.vectors.length} chunks
        </h2>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Clear chat"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <MessageSquare
                size={40}
                className="mx-auto text-zinc-700 mb-3"
              />
              <p className="text-sm text-zinc-500 mb-4">
                Ask a question about your documents
              </p>
              <div className="space-y-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="block w-full text-left px-4 py-2 rounded-lg bg-zinc-800/50 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>

      <ChatInput onSend={sendMessage} disabled={streaming} />
    </div>
  );
}
