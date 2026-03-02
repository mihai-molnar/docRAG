import { useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import { useAppStore } from "../store/appStore";
import { loadConversations, clearConversationState } from "./useConversations";

async function fetchProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("prompt_count, prompt_limit")
    .single();

  if (!error && data) {
    useAppStore.getState().setPromptCount(data.prompt_count);
    useAppStore.getState().setPromptLimit(data.prompt_limit);
  }
}

export function useAuth() {
  const user = useAppStore((s) => s.user);
  const authLoading = useAppStore((s) => s.authLoading);
  const promptCount = useAppStore((s) => s.promptCount);
  const promptLimit = useAppStore((s) => s.promptLimit);

  useEffect(() => {
    const { setUser, setSession, setAuthLoading } = useAppStore.getState();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile();
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile();
        loadConversations();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    useAppStore.getState().setPromptCount(0);
    useAppStore.getState().setPromptLimit(5);
    clearConversationState();
  }, []);

  return {
    user,
    authLoading,
    promptCount,
    promptLimit,
    promptsRemaining: promptLimit - promptCount,
    signUp,
    signIn,
    signOut,
  };
}
