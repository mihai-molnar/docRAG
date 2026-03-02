import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Download, RefreshCw, CheckCircle2 } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { checkOllamaInstalled, startOllamaServe } from "../../services/tauriCommands";
import { checkOllamaStatus, pullOllamaModel } from "../../services/openaiClient";
import { useAppStore } from "../../store/appStore";

type SetupState =
  | "checking"
  | "not_installed"
  | "starting"
  | "pulling"
  | "ready";

export function OllamaSetup() {
  const setOllamaReady = useAppStore((s) => s.setOllamaReady);
  const [state, setState] = useState<SetupState>("checking");
  const [pullProgress, setPullProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  const runSetup = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setError(null);

    try {
      // Step 1: Check if Ollama is installed
      setState("checking");
      const installed = await checkOllamaInstalled();
      if (!installed) {
        setState("not_installed");
        running.current = false;
        return;
      }

      // Step 2: Check if server is running
      let status = await checkOllamaStatus();

      if (!status.running) {
        // Step 3: Start the server
        setState("starting");
        try {
          await startOllamaServe();
        } catch {
          // Port may already be taken — that's fine
        }

        // Poll until responsive (up to ~10s)
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 500));
          status = await checkOllamaStatus();
          if (status.running) break;
        }

        if (!status.running) {
          setError("Could not start Ollama server. Try running 'ollama serve' manually.");
          setState("not_installed");
          running.current = false;
          return;
        }
      }

      // Step 4: Check if model is available
      if (!status.hasModel) {
        setState("pulling");
        setPullProgress(0);

        for await (const progress of pullOllamaModel()) {
          if (progress.total && progress.completed) {
            setPullProgress(Math.round((progress.completed / progress.total) * 100));
          }
        }
      }

      // Step 5: Ready
      setState("ready");
      setTimeout(() => setOllamaReady(true), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
      setState("not_installed");
    } finally {
      running.current = false;
    }
  }, [setOllamaReady]);

  useEffect(() => {
    runSetup();
  }, [runSetup]);

  const handleRetry = () => {
    running.current = false;
    runSetup();
  };

  return (
    <div className="h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Inkling</h1>
          <p className="text-sm text-zinc-500 mt-1">Setting up local embeddings</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          {state === "checking" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 size={24} className="animate-spin text-zinc-400" />
              <p className="text-sm text-zinc-400">Checking Ollama...</p>
            </div>
          )}

          {state === "not_installed" && (
            <div className="flex flex-col items-center gap-4 py-2">
              <p className="text-sm text-zinc-300 text-center">
                Ollama is required for local document embeddings. Install it to continue.
              </p>
              <button
                onClick={() => openUrl("https://ollama.com/download")}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500 transition-colors text-white"
              >
                <Download size={16} />
                Download Ollama
              </button>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <RefreshCw size={14} />
                Retry
              </button>
              {error && (
                <p className="text-xs text-red-400 text-center mt-1">{error}</p>
              )}
            </div>
          )}

          {state === "starting" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 size={24} className="animate-spin text-zinc-400" />
              <p className="text-sm text-zinc-400">Starting Ollama...</p>
            </div>
          )}

          {state === "pulling" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-sm text-zinc-300">Downloading embedding model...</p>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${pullProgress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500">{pullProgress}%</p>
            </div>
          )}

          {state === "ready" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={24} className="text-green-400" />
              <p className="text-sm text-zinc-300">Ready!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
