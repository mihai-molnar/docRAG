import { FileText, FileSpreadsheet, Presentation } from "lucide-react";
import type { PersistedIndex } from "../../types/vectorStore";

interface DocumentListProps {
  index: PersistedIndex;
}

function getIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return <FileText size={16} className="text-red-400" />;
    case "docx":
      return <FileSpreadsheet size={16} className="text-blue-400" />;
    case "pptx":
      return <Presentation size={16} className="text-orange-400" />;
    default:
      return <FileText size={16} className="text-zinc-400" />;
  }
}

export function DocumentList({ index }: DocumentListProps) {
  if (!index.files.length) {
    return (
      <p className="text-sm text-zinc-500">No documents found in the index.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500 border-b border-zinc-800">
            <th className="pb-2 pl-2 font-medium">Name</th>
            <th className="pb-2 font-medium">Type</th>
            <th className="pb-2 font-medium text-right pr-2">Chunks</th>
          </tr>
        </thead>
        <tbody>
          {index.files.map((file) => {
            const ext = file.name.split(".").pop()?.toUpperCase() || "";
            return (
              <tr
                key={file.path}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
              >
                <td className="py-2 pl-2">
                  <div className="flex items-center gap-2">
                    {getIcon(file.name)}
                    <span
                      className="truncate max-w-[300px]"
                      title={file.path}
                    >
                      {file.name}
                    </span>
                  </div>
                </td>
                <td className="py-2 text-zinc-400">{ext}</td>
                <td className="py-2 text-right pr-2 text-zinc-400">
                  {file.chunkCount}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
