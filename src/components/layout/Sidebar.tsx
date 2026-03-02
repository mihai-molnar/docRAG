import { MessageSquare, FolderOpen, Settings, LogOut, Plus, Trash2 } from "lucide-react";
import { useAppStore, type ActiveView } from "../../store/appStore";
import { useAuth } from "../../hooks/useAuth";
import { useConversations } from "../../hooks/useConversations";

const NAV_ITEMS: Array<{ view: ActiveView; icon: typeof MessageSquare; label: string }> = [
  { view: "chat", icon: MessageSquare, label: "Chat" },
  { view: "documents", icon: FolderOpen, label: "Documents" },
  { view: "settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const index = useAppStore((s) => s.index);
  const { user, promptCount, promptLimit, signOut } = useAuth();
  const {
    folderConversations,
    activeConversationId,
    switchConversation,
    newConversation,
    deleteConversation,
  } = useConversations();

  const handleNewConversation = () => {
    newConversation();
    setActiveView("chat");
  };

  const handleSwitchConversation = (id: string) => {
    switchConversation(id);
    setActiveView("chat");
  };

  return (
    <aside className="w-[220px] shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-lg font-bold text-white">Inkling</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Chat with your documents</p>
      </div>

      <nav className="p-2 space-y-1">
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

      {index && folderConversations.length > 0 ? (
        <div className="flex-1 min-h-0 flex flex-col border-t border-zinc-800">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              History
            </span>
            <button
              onClick={handleNewConversation}
              className="p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="New conversation"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {folderConversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-1 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                  activeConversationId === conv.id
                    ? "bg-zinc-800 text-zinc-200"
                    : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
                onClick={() => handleSwitchConversation(conv.id)}
              >
                <span className="flex-1 truncate">{conv.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="shrink-0 p-0.5 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 transition-opacity"
                  title="Delete conversation"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className="p-4 border-t border-zinc-800 space-y-3">
        {user && (
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p
                className="text-xs text-zinc-400 truncate"
                title={user.email ?? ""}
              >
                {user.email}
              </p>
              <p className="text-xs text-zinc-500">
                {promptCount}/{promptLimit} prompts used
              </p>
            </div>
            <button
              onClick={signOut}
              className="shrink-0 p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
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
