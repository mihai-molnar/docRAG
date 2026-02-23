import type { IndexProgress } from "../../services/indexManager";

interface IndexingProgressProps {
  progress: IndexProgress;
}

export function IndexingProgress({ progress }: IndexingProgressProps) {
  const percentage =
    progress.filesTotal > 0
      ? Math.round((progress.filesProcessed / progress.filesTotal) * 100)
      : 0;

  const phaseLabels: Record<IndexProgress["phase"], string> = {
    scanning: "Scanning folder...",
    parsing: `Parsing: ${progress.currentFile || "..."}`,
    embedding: "Generating embeddings...",
    saving: "Saving index...",
    done: "Done!",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-300">{phaseLabels[progress.phase]}</span>
        {progress.filesTotal > 0 && (
          <span className="text-zinc-500">
            {progress.filesProcessed}/{progress.filesTotal} files — {percentage}%
          </span>
        )}
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
          style={{ width: `${progress.phase === "done" ? 100 : percentage}%` }}
        />
      </div>
    </div>
  );
}
