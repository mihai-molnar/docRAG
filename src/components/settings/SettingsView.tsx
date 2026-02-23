import { AlertTriangle } from "lucide-react";
import { useSettings } from "../../hooks/useSettings";
import { useAppStore } from "../../store/appStore";
import { CHAT_MODELS, EMBEDDING_MODELS } from "../../types/settings";
import { ApiKeyInput } from "./ApiKeyInput";
import { ModelSelector } from "./ModelSelector";

export function SettingsView() {
  const { settings, saveSetting } = useSettings();
  const index = useAppStore((s) => s.index);

  const embeddingModelChanged =
    index && index.embeddingModel !== settings.embeddingModel;
  const chunkSettingsChanged =
    index &&
    (index.chunkSize !== settings.chunkSize ||
      index.chunkOverlap !== settings.chunkOverlap);
  const needsReindex = embeddingModelChanged || chunkSettingsChanged;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-lg space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-zinc-200 mb-1">Settings</h2>
          <p className="text-sm text-zinc-500">
            Configure your API key, models, and indexing parameters.
          </p>
        </div>

        <section className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            API
          </h3>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              OpenAI API Key
            </label>
            <ApiKeyInput
              value={settings.apiKey}
              onChange={(v) => saveSetting("apiKey", v)}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Models
          </h3>
          <ModelSelector
            label="Chat Model"
            value={settings.chatModel}
            options={CHAT_MODELS}
            onChange={(v) => saveSetting("chatModel", v)}
          />
          <ModelSelector
            label="Embedding Model"
            value={settings.embeddingModel}
            options={EMBEDDING_MODELS}
            onChange={(v) => saveSetting("embeddingModel", v)}
          />
        </section>

        {needsReindex && (
          <div className="flex items-start gap-3 text-amber-400 bg-amber-400/10 px-4 py-3 rounded-lg text-sm">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Re-indexing required</p>
              <p className="text-amber-400/70 mt-0.5">
                {embeddingModelChanged
                  ? "The embedding model has changed. "
                  : ""}
                {chunkSettingsChanged ? "Chunk settings have changed. " : ""}
                Go to Documents and re-index to apply changes.
              </p>
            </div>
          </div>
        )}

        <section className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Indexing
          </h3>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Chunk Size (characters)
            </label>
            <input
              type="number"
              value={settings.chunkSize}
              onChange={(e) =>
                saveSetting("chunkSize", Math.max(100, parseInt(e.target.value) || 512))
              }
              min={100}
              max={4000}
              className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Chunk Overlap (characters)
            </label>
            <input
              type="number"
              value={settings.chunkOverlap}
              onChange={(e) =>
                saveSetting(
                  "chunkOverlap",
                  Math.max(0, parseInt(e.target.value) || 100)
                )
              }
              min={0}
              max={1000}
              className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Chat
          </h3>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Top-K Results
            </label>
            <input
              type="number"
              value={settings.topK}
              onChange={(e) =>
                saveSetting("topK", Math.max(1, parseInt(e.target.value) || 5))
              }
              min={1}
              max={20}
              className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Temperature
            </label>
            <input
              type="number"
              value={settings.temperature}
              onChange={(e) =>
                saveSetting(
                  "temperature",
                  Math.min(2, Math.max(0, parseFloat(e.target.value) || 0.1))
                )
              }
              min={0}
              max={2}
              step={0.1}
              className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
