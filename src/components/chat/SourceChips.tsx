import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { openPath } from "@tauri-apps/plugin-opener";
import { getIcon } from "../../lib/docIcon";
import type { ChatSource } from "../../types/chat";

interface SourceChipsProps {
  sources: ChatSource[];
}

/** Keep only the highest-scoring chunk per document. */
function dedupeByDocument(sources: ChatSource[]): ChatSource[] {
  const best = new Map<string, ChatSource>();
  for (const s of sources) {
    const existing = best.get(s.documentPath);
    if (!existing || s.score > existing.score) {
      best.set(s.documentPath, s);
    }
  }
  // Preserve original score ordering
  return Array.from(best.values()).sort((a, b) => b.score - a.score);
}

export function SourceChips({ sources }: SourceChipsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const dedupedSources = useMemo(() => dedupeByDocument(sources), [sources]);

  if (!dedupedSources.length) return null;

  const toggle = (i: number) => {
    setExpandedIndex(expandedIndex === i ? null : i);
  };

  const handleOpen = async (source: ChatSource) => {
    try {
      await openPath(source.documentPath);
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  };

  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
        Sources
      </p>
      {dedupedSources.map((source, i) => {
        const isExpanded = expandedIndex === i;
        const location = source.pageNumber
          ? `${source.documentName} — p.${source.pageNumber}`
          : source.documentName;

        return (
          <div key={i} className="rounded-lg bg-zinc-800/60 overflow-hidden">
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-zinc-800 transition-colors"
            >
              <span className="shrink-0">{getIcon(source.documentName, 13)}</span>
              <span className="text-xs text-zinc-300 truncate flex-1">
                {location}
              </span>
              {isExpanded ? (
                <ChevronUp size={13} className="text-zinc-500 shrink-0" />
              ) : (
                <ChevronDown size={13} className="text-zinc-500 shrink-0" />
              )}
            </button>

            {isExpanded && (
              <div className="px-3 pb-2.5 space-y-2">
                <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap select-text">
                  {source.chunkContent}
                </p>
                <button
                  onClick={() => handleOpen(source)}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <ExternalLink size={11} />
                  Open file
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
