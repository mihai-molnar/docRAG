import { useEffect, useState } from "react";
import { AlertTriangle, HelpCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useSettings } from "../../hooks/useSettings";
import { useAppStore } from "../../store/appStore";
import { CHAT_MODELS } from "../../types/settings";
import { checkOllamaStatus, OLLAMA_EMBED_MODEL } from "../../services/openaiClient";
import { ApiKeyInput } from "./ApiKeyInput";
import { ModelSelector } from "./ModelSelector";

function SettingLabel({ text, tooltip }: { text: string; tooltip: string }) {
  return (
    <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 mb-1.5">
      {text}
      <span className="relative group">
        <HelpCircle size={14} className="text-zinc-500 cursor-help" />
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-700 text-xs text-zinc-200 whitespace-normal w-56 text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity pointer-events-none z-50">
          {tooltip}
        </span>
      </span>
    </label>
  );
}

function OllamaStatus() {
  const [status, setStatus] = useState<{ running: boolean; hasModel: boolean } | null>(null);

  useEffect(() => {
    checkOllamaStatus().then(setStatus);
  }, []);

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 size={14} className="animate-spin" />
        Checking Ollama...
      </div>
    );
  }

  if (!status.running) {
    return (
      <div className="flex items-start gap-2 text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
        <XCircle size={16} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Ollama is not running</p>
          <p className="text-red-400/70 mt-0.5">
            Install with <code className="bg-red-400/10 px-1 rounded">brew install ollama</code> and
            run <code className="bg-red-400/10 px-1 rounded">ollama serve</code>
          </p>
        </div>
      </div>
    );
  }

  if (!status.hasModel) {
    return (
      <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-400/10 px-3 py-2 rounded-lg">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Embedding model not found</p>
          <p className="text-amber-400/70 mt-0.5">
            Run <code className="bg-amber-400/10 px-1 rounded">ollama pull {OLLAMA_EMBED_MODEL}</code> to
            download it
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-emerald-400">
      <CheckCircle2 size={16} />
      Ollama running — {OLLAMA_EMBED_MODEL} ready
    </div>
  );
}

export function SettingsView() {
  const { settings, saveSetting } = useSettings();
  const index = useAppStore((s) => s.index);

  const chunkSettingsChanged =
    index &&
    (index.chunkSize !== settings.chunkSize ||
      index.chunkOverlap !== settings.chunkOverlap);

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
            <SettingLabel
              text="OpenAI API Key"
              tooltip="Your secret API key from platform.openai.com. Used for chat completions only. Stored locally on your device."
            />
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
            tooltip="The OpenAI model used to generate chat responses. Larger models are more capable but slower and cost more."
          />
          <div>
            <SettingLabel
              text="Embeddings"
              tooltip="Document embeddings run locally via Ollama for free. No API key needed for indexing."
            />
            <OllamaStatus />
          </div>
        </section>

        {chunkSettingsChanged && (
          <div className="flex items-start gap-3 text-amber-400 bg-amber-400/10 px-4 py-3 rounded-lg text-sm">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Re-indexing required</p>
              <p className="text-amber-400/70 mt-0.5">
                Chunk settings have changed. Go to Documents and re-index to apply changes.
              </p>
            </div>
          </div>
        )}

        <section className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Indexing
          </h3>

          <div>
            <SettingLabel
              text="Chunk Size (characters)"
              tooltip="How many characters each document chunk contains. Larger chunks give more context per result but may dilute relevance."
            />
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
            <SettingLabel
              text="Chunk Overlap (characters)"
              tooltip="How many characters overlap between consecutive chunks. Overlap helps avoid splitting important sentences across chunks."
            />
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
            <SettingLabel
              text="Top-K Results"
              tooltip="Number of most relevant chunks retrieved from the index and sent to the model as context for each question."
            />
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
            <SettingLabel
              text="Temperature"
              tooltip="Controls response randomness. Lower values (0–0.3) give focused, deterministic answers. Higher values (0.7+) give more creative, varied responses."
            />
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
