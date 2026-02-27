import { supabase } from "./supabase";
import { useAppStore } from "../store/appStore";
import type { PromptCheckResult } from "../types/auth";

export async function checkAndIncrementPrompt(): Promise<PromptCheckResult> {
  const { data, error } = await supabase.rpc("increment_prompt_count");

  if (error) {
    throw new Error(`Prompt limit check failed: ${error.message}`);
  }

  const result = data as PromptCheckResult;
  const store = useAppStore.getState();
  store.setPromptCount(result.prompt_count);
  store.setPromptLimit(result.prompt_limit);

  return result;
}
