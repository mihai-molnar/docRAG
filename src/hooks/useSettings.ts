import { load } from "@tauri-apps/plugin-store";
import { useAppStore } from "../store/appStore";
import type { AppSettings } from "../types/settings";
import { DEFAULT_SETTINGS } from "../types/settings";

const STORE_NAME = "settings.json";

let storePromise: ReturnType<typeof load> | null = null;

function getStore() {
  if (!storePromise) {
    storePromise = load(STORE_NAME);
  }
  return storePromise;
}

export async function loadSettings() {
  const store = await getStore();
  const saved = await store.get<AppSettings>("settings");
  if (saved) {
    useAppStore.getState().setSettings({ ...DEFAULT_SETTINGS, ...saved });
  }
}

export function useSettings() {
  const settings = useAppStore((s) => s.settings);
  const updateSetting = useAppStore((s) => s.updateSetting);

  const saveSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    updateSetting(key, value);
    const store = await getStore();
    const current = (await store.get<AppSettings>("settings")) || DEFAULT_SETTINGS;
    await store.set("settings", { ...current, [key]: value });
    await store.save();
  };

  return { settings, saveSetting };
}
