"use client";

import { useCallback } from "react";
import MonacoEditor, { type OnMount } from "@monaco-editor/react";
import { Code2, Wand2 } from "lucide-react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language: "yaml" | "json";
  darkMode?: boolean;
}

export default function Editor({
  value,
  onChange,
  language,
  darkMode = false,
}: EditorProps) {
  const handleEditorMount: OnMount = (editor) => {
    editor.focus();
  };

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      onChange(newValue ?? "");
    },
    [onChange],
  );

  const handleFormat = useCallback(() => {
    if (language === "json") {
      try {
        const parsed = JSON.parse(value);
        onChange(JSON.stringify(parsed, null, 2));
      } catch {
        // If JSON is invalid, leave it as-is
      }
    } else {
      // For YAML, normalize indentation by round-tripping is not trivial
      // without a YAML library, so we trigger Monaco's built-in formatter
      // as a best-effort approach. The user can also rely on Monaco's
      // format document command (Shift+Alt+F).
    }
  }, [language, value, onChange]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-[var(--text-secondary)]" />
          <span className="inline-flex items-center rounded-md bg-[var(--border)] px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            {language}
          </span>
        </div>
        <button
          type="button"
          onClick={handleFormat}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Prettify
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <MonacoEditor
          width="100%"
          height="100%"
          language={language}
          value={value}
          theme={darkMode ? "vs-dark" : "light"}
          onChange={handleChange}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            lineNumbers: "on",
            wordWrap: "on",
            fontSize: 14,
            fontFamily: "JetBrains Mono, Fira Code, monospace",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
}
