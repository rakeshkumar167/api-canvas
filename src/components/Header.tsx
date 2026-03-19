"use client";

import { Sun, Moon, Upload, Download, FileJson, FileText } from "lucide-react";
import { useRef } from "react";

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onImport: (content: string, format: "yaml" | "json") => void;
  onExport: (format: "yaml" | "json" | "html") => void;
  specTitle?: string;
}

export default function Header({ darkMode, onToggleDarkMode, onImport, onExport, specTitle }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const format = file.name.endsWith(".json") ? "json" : "yaml";
      onImport(content, format);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <FileJson className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">API Canvas</h1>
        </div>
        {specTitle && (
          <>
            <span className="text-[var(--text-muted)]">/</span>
            <span className="text-sm text-[var(--text-secondary)]">{specTitle}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <input
          ref={fileInputRef}
          type="file"
          accept=".yaml,.yml,.json"
          onChange={handleFileImport}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
          title="Import OpenAPI spec"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Import</span>
        </button>

        <div className="relative group">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
            title="Export"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <div className="absolute right-0 top-full mt-1 w-44 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <button
              onClick={() => onExport("yaml")}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            >
              <FileText className="w-4 h-4" />
              Export as YAML
            </button>
            <button
              onClick={() => onExport("json")}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            >
              <FileJson className="w-4 h-4" />
              Export as JSON
            </button>
            <button
              onClick={() => onExport("html")}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            >
              <FileText className="w-4 h-4" />
              Export as HTML
            </button>
          </div>
        </div>

        <div className="w-px h-6 bg-[var(--border)] mx-1" />

        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
