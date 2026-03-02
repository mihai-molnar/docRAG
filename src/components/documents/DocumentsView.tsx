import { useState, useEffect } from "react";
import { Database, RefreshCw, Trash2, AlertCircle, Info, Loader2 } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import { useIndex } from "../../hooks/useIndex";
import { countFolderPages } from "../../services/pageCounter";
import { FolderPicker } from "./FolderPicker";
import { DocumentList } from "./DocumentList";
import { IndexingProgress } from "./IndexingProgress";

export function DocumentsView() {
  const settings = useAppStore((s) => s.settings);
  const folderPath = useAppStore((s) => s.folderPath);
  const { index, indexing, indexProgress, startIndexing, clearIndex } =
    useIndex();
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<{ total: number; exact: boolean } | null>(null);
  const [countingPages, setCountingPages] = useState(false);

  useEffect(() => setPageCount(null), [folderPath]);

  const handleIndex = async () => {
    setError(null);
    try {
      await startIndexing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Indexing failed");
    }
  };

  const hasApiKey = !!settings.apiKey;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-1">Documents</h2>
        <p className="text-sm text-zinc-500">
          Select a folder and index your documents for RAG chat.
        </p>
      </div>

      <FolderPicker />

      {!hasApiKey && (
        <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-4 py-3 rounded-lg text-sm">
          <AlertCircle size={16} />
          Set your OpenAI API key in Settings before indexing.
        </div>
      )}

      {folderPath && hasApiKey && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleIndex}
            disabled={indexing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {index ? (
              <>
                <RefreshCw size={16} className={indexing ? "animate-spin" : ""} />
                Re-index
              </>
            ) : (
              <>
                <Database size={16} />
                Index Documents
              </>
            )}
          </button>

          {index && !indexing && (
            <button
              onClick={clearIndex}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
            >
              <Trash2 size={16} />
              Clear Index
            </button>
          )}
        </div>
      )}

      {folderPath && hasApiKey && (
        <div className="flex items-start gap-2 text-zinc-400 bg-zinc-800/50 px-4 py-3 rounded-lg text-sm">
          <Info size={16} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p>
              For best results, keep your folder under ~1,000 total pages. Larger
              collections may experience slower indexing or errors.
            </p>
            {pageCount ? (
              <p className={`mt-1 font-medium ${pageCount.total > 1000 ? "text-amber-400" : "text-zinc-300"}`}>
                {pageCount.exact ? "" : "~"}{pageCount.total.toLocaleString()} pages detected
                {pageCount.total > 1000 && " — consider reducing your folder size"}
              </p>
            ) : (
              <button
                onClick={async () => {
                  setCountingPages(true);
                  try {
                    const result = await countFolderPages(folderPath);
                    setPageCount(result);
                  } catch {
                    setPageCount(null);
                  } finally {
                    setCountingPages(false);
                  }
                }}
                disabled={countingPages}
                className="mt-1 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
              >
                {countingPages ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Counting…
                  </>
                ) : (
                  "Check number of pages"
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-3 rounded-lg text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {indexing && indexProgress && <IndexingProgress progress={indexProgress} />}

      {index && !indexing && <DocumentList index={index} />}

      {!index && !indexing && !folderPath && (
        <div className="text-center py-12">
          <Database size={48} className="mx-auto text-zinc-700 mb-4" />
          <p className="text-sm text-zinc-500">
            Select a folder to get started
          </p>
        </div>
      )}
    </div>
  );
}
