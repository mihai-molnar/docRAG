import { MessageSquare, FolderOpen, Settings } from "lucide-react";
import { useAppStore, type ActiveView } from "../../store/appStore";

const NAV_ITEMS: Array<{ view: ActiveView; icon: typeof MessageSquare; label: string }> = [
  { view: "chat", icon: MessageSquare, label: "Chat" },
  { view: "documents", icon: FolderOpen, label: "Documents" },
  { view: "settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const index = useAppStore((s) => s.index);

  return (
    <aside className="w-[220px] shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-lg font-bold text-white">DocRAG</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Chat with your documents</p>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map(({ view, icon: Icon, label }) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeView === view
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-500">
          {index ? (
            <>
              <p>{index.files.length} documents indexed</p>
              <p>{index.vectors.length} chunks</p>
            </>
          ) : (
            <p>No index loaded</p>
          )}
        </div>
      </div>
    </aside>
  );
}
