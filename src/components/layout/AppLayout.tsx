import { Sidebar } from "./Sidebar";
import { useAppStore } from "../../store/appStore";
import { ChatView } from "../chat/ChatView";
import { DocumentsView } from "../documents/DocumentsView";
import { SettingsView } from "../settings/SettingsView";

export function AppLayout() {
  const activeView = useAppStore((s) => s.activeView);

  return (
    <div className="h-screen flex bg-zinc-950 text-zinc-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeView === "chat" && <ChatView />}
        {activeView === "documents" && <DocumentsView />}
        {activeView === "settings" && <SettingsView />}
      </main>
    </div>
  );
}
