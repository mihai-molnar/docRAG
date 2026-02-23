import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen } from "lucide-react";
import { useAppStore } from "../../store/appStore";

export function FolderPicker() {
  const folderPath = useAppStore((s) => s.folderPath);
  const setFolderPath = useAppStore((s) => s.setFolderPath);

  const selectFolder = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (selected) {
      setFolderPath(selected as string);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={selectFolder}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
      >
        <FolderOpen size={16} />
        {folderPath ? "Change Folder" : "Select Folder"}
      </button>
      {folderPath && (
        <span className="text-sm text-zinc-400 truncate max-w-[400px]" title={folderPath}>
          {folderPath}
        </span>
      )}
    </div>
  );
}
