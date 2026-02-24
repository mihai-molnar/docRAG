import { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { getActiveMention, filterDocuments } from "../../lib/mentionParser";
import { MentionDropdown } from "./MentionDropdown";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  documentNames: string[];
}

export function ChatInput({ onSend, disabled, documentNames }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [filteredDocs, setFilteredDocs] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mentionActive, setMentionActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    setMentionActive(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const updateMentionState = useCallback(
    (text: string, cursorPos: number) => {
      if (!documentNames.length) {
        setMentionActive(false);
        return;
      }
      const mention = getActiveMention(text, cursorPos);
      if (mention) {
        const matches = filterDocuments(mention.query, documentNames);
        setFilteredDocs(matches);
        setActiveIndex(0);
        setMentionActive(matches.length > 0);
      } else {
        setMentionActive(false);
      }
    },
    [documentNames]
  );

  const insertMention = useCallback(
    (docName: string) => {
      const el = textareaRef.current;
      if (!el) return;

      const cursorPos = el.selectionStart;
      const mention = getActiveMention(value, cursorPos);
      if (!mention) return;

      const before = value.slice(0, mention.startIndex);
      const after = value.slice(mention.endIndex);
      const inserted = `@${docName} `;
      const newValue = before + inserted + after;
      const newCursor = before.length + inserted.length;

      setValue(newValue);
      setMentionActive(false);

      requestAnimationFrame(() => {
        el.selectionStart = newCursor;
        el.selectionEnd = newCursor;
        el.focus();
      });
    },
    [value]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionActive && filteredDocs.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filteredDocs.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(
          (i) => (i - 1 + filteredDocs.length) % filteredDocs.length
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredDocs[activeIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionActive(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  };

  return (
    <div className="border-t border-zinc-800 p-4">
      <div className="relative flex gap-2 items-end">
        {mentionActive && (
          <MentionDropdown
            items={filteredDocs}
            activeIndex={activeIndex}
            onSelect={insertMention}
          />
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            handleInput();
            updateMentionState(e.target.value, e.target.selectionStart);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            documentNames.length
              ? "Ask about your documents... (@ to mention)"
              : "Ask about your documents..."
          }
          disabled={disabled}
          rows={1}
          className="flex-1 bg-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
