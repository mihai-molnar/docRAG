import { useEffect } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { useIndex } from "./hooks/useIndex";
import { loadSettings } from "./hooks/useSettings";

export default function App() {
  const { restore } = useIndex();

  useEffect(() => {
    loadSettings();
    restore();
  }, [restore]);

  return <AppLayout />;
}
