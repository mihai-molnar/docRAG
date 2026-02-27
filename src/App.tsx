import { useEffect } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthScreen } from "./components/auth/AuthScreen";
import { useIndex } from "./hooks/useIndex";
import { useAuth } from "./hooks/useAuth";
import { loadSettings } from "./hooks/useSettings";
import { Loader2 } from "lucide-react";

export default function App() {
  const { restore } = useIndex();
  const { user, authLoading } = useAuth();

  useEffect(() => {
    loadSettings();
    restore();
  }, [restore]);

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

  return <AppLayout />;
}
