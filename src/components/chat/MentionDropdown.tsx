import { useRef, useEffect } from "react";
import { getIcon } from "../../lib/docIcon";

interface MentionDropdownProps {
  items: string[];
  activeIndex: number;
  onSelect: (name: string) => void;
}

export function MentionDropdown({
  items,
  activeIndex,
  onSelect,
}: MentionDropdownProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = listRef.current?.children[activeIndex] as HTMLElement;
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!items.length) return null;

  return (
    <div
      ref={listRef}
      className="absolute bottom-full left-0 w-full mb-1 max-h-52 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-lg z-50"
    >
      {items.map((name, i) => (
        <button
          key={name}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(name);
          }}
          className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors ${
            i === activeIndex
              ? "bg-indigo-600/20 text-zinc-100"
              : "text-zinc-300 hover:bg-zinc-800"
          }`}
        >
          {getIcon(name)}
          <span className="truncate">{name}</span>
        </button>
      ))}
    </div>
  );
}
