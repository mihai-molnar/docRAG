import { FileText, FileSpreadsheet, Presentation } from "lucide-react";

export function getIcon(name: string, size = 16) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return <FileText size={size} className="text-red-400" />;
    case "docx":
      return <FileSpreadsheet size={size} className="text-blue-400" />;
    case "pptx":
      return <Presentation size={size} className="text-orange-400" />;
    default:
      return <FileText size={size} className="text-zinc-400" />;
  }
}
