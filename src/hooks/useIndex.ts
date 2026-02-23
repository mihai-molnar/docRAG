import { useCallback } from "react";
import { useAppStore } from "../store/appStore";
import { buildIndex, restoreIndex } from "../services/indexManager";
import { deleteIndex as deletePersistedIndex } from "../services/tauriCommands";
import { vectorStore } from "../services/vectorStore";

export function useIndex() {
  const settings = useAppStore((s) => s.settings);
  const index = useAppStore((s) => s.index);
  const setIndex = useAppStore((s) => s.setIndex);
  const folderPath = useAppStore((s) => s.folderPath);
  const indexing = useAppStore((s) => s.indexing);
  const setIndexing = useAppStore((s) => s.setIndexing);
  const indexProgress = useAppStore((s) => s.indexProgress);
  const setIndexProgress = useAppStore((s) => s.setIndexProgress);

  const startIndexing = useCallback(async () => {
    if (!folderPath || !settings.apiKey) return;

    setIndexing(true);
    setIndexProgress(null);

    try {
      const result = await buildIndex(folderPath, settings, (progress) => {
        setIndexProgress(progress);
      });
      setIndex(result);
    } catch (err) {
      console.error("Indexing failed:", err);
      throw err;
    } finally {
      setIndexing(false);
    }
  }, [folderPath, settings, setIndex, setIndexing, setIndexProgress]);

  const restore = useCallback(async () => {
    const restored = await restoreIndex();
    if (restored) {
      setIndex(restored);
      useAppStore.getState().setFolderPath(restored.folderPath);
    }
    return restored;
  }, [setIndex]);

  const clearIndex = useCallback(async () => {
    await deletePersistedIndex();
    vectorStore.clear();
    setIndex(null);
    setIndexProgress(null);
  }, [setIndex, setIndexProgress]);

  return {
    index,
    indexing,
    indexProgress,
    startIndexing,
    restore,
    clearIndex,
  };
}
