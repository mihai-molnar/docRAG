import { HelpCircle } from "lucide-react";

interface ModelSelectorProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  tooltip?: string;
}

export function ModelSelector({
  label,
  value,
  options,
  onChange,
  tooltip,
}: ModelSelectorProps) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 mb-1.5">
        {label}
        {tooltip && (
          <span className="relative group">
            <HelpCircle size={14} className="text-zinc-500 cursor-help" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-700 text-xs text-zinc-200 whitespace-normal w-56 text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity pointer-events-none z-50">
              {tooltip}
            </span>
          </span>
        )}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
