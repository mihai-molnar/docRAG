import { useState } from "react";
import { User, Bot, Copy, Check, Download } from "lucide-react";
import type { ChatMessage } from "../../types/chat";
import { SourceChips } from "./SourceChips";
import { downloadMessageAsPdf } from "../../lib/pdfExport";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = async () => {
    await downloadMessageAsPdf(message.content);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 1500);
  };

  return (
    <div className={`group flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
          <Bot size={16} />
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-indigo-600 text-white rounded-br-md"
              : "bg-zinc-800 text-zinc-100 rounded-bl-md"
          }`}
        >
          {message.content || (
            <span className="inline-block w-2 h-4 bg-zinc-500 animate-pulse rounded-sm" />
          )}
          {!isUser && message.content && (
            <div className="absolute -bottom-3 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleDownload}
                className="p-1 rounded-md bg-zinc-700 hover:bg-zinc-600 text-zinc-400 hover:text-zinc-200"
                title="Download as PDF"
              >
                {downloaded ? <Check size={13} /> : <Download size={13} />}
              </button>
              <button
                onClick={handleCopy}
                className="p-1 rounded-md bg-zinc-700 hover:bg-zinc-600 text-zinc-400 hover:text-zinc-200"
                title="Copy"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
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
