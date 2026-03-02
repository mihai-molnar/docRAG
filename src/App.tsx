import { useEffect } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthScreen } from "./components/auth/AuthScreen";
import { OllamaSetup } from "./components/setup/OllamaSetup";
import { useIndex } from "./hooks/useIndex";
import { useAuth } from "./hooks/useAuth";
import { loadSettings } from "./hooks/useSettings";
import { loadConversations } from "./hooks/useConversations";
import { useAppStore } from "./store/appStore";
import { Loader2 } from "lucide-react";

export default function App() {
  const { restore } = useIndex();
  const { user, authLoading } = useAuth();
  const ollamaReady = useAppStore((s) => s.ollamaReady);

  useEffect(() => {
    loadSettings();
    restore();
  }, [restore]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!ollamaReady) {
    return <OllamaSetup />;
  }

  return <AppLayout />;
}
