"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import yaml from "js-yaml";
import Header from "@/components/Header";
import TabBar, { type ViewTab } from "@/components/TabBar";
import { parseOpenAPISpec, DEFAULT_SPEC } from "@/lib/openapi-parser";
import type { OpenAPISpec } from "@/types/openapi";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });
const ApiPreview = dynamic(() => import("@/components/ApiPreview"), { ssr: false });

export default function Home() {
  const [editorContent, setEditorContent] = useState(DEFAULT_SPEC);
  const [parsedSpec, setParsedSpec] = useState<OpenAPISpec | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>("split");
  const [darkMode, setDarkMode] = useState(false);
  const [editorLanguage, setEditorLanguage] = useState<"yaml" | "json">("yaml");
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  // Parse on mount
  useEffect(() => {
    const { spec, error } = parseOpenAPISpec(editorContent);
    setParsedSpec(spec);
    setParseError(error);
  }, []);

  // Dark mode
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const saved = localStorage.getItem("api-canvas-dark-mode");
    const isDark = saved !== null ? saved === "true" : prefersDark;
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("api-canvas-dark-mode", String(next));
      return next;
    });
  }, []);

  // Debounced parse
  const handleEditorChange = useCallback((value: string) => {
    setEditorContent(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const { spec, error } = parseOpenAPISpec(value);
      setParsedSpec(spec);
      setParseError(error);
    }, 300);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "1") { e.preventDefault(); setActiveTab("docs"); }
        if (e.key === "2") { e.preventDefault(); setActiveTab("edit"); }
        if (e.key === "3") { e.preventDefault(); setActiveTab("split"); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Import
  const handleImport = useCallback((content: string, format: "yaml" | "json") => {
    setEditorContent(content);
    setEditorLanguage(format);
    const { spec, error } = parseOpenAPISpec(content);
    setParsedSpec(spec);
    setParseError(error);
  }, []);

  // Export
  const handleExport = useCallback(
    (format: "yaml" | "json" | "html") => {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === "json") {
        try {
          const parsed = yaml.load(editorContent);
          content = JSON.stringify(parsed, null, 2);
        } catch {
          content = editorContent;
        }
        filename = "api-spec.json";
        mimeType = "application/json";
      } else if (format === "yaml") {
        if (editorLanguage === "json") {
          try {
            const parsed = JSON.parse(editorContent);
            content = yaml.dump(parsed, { indent: 2, lineWidth: 120 });
          } catch {
            content = editorContent;
          }
        } else {
          content = editorContent;
        }
        filename = "api-spec.yaml";
        mimeType = "text/yaml";
      } else {
        // HTML export
        content = generateHtmlExport(parsedSpec);
        filename = "api-docs.html";
        mimeType = "text/html";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [editorContent, editorLanguage, parsedSpec]
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onImport={handleImport}
        onExport={handleExport}
        specTitle={parsedSpec?.info?.title}
      />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex overflow-hidden">
        {/* Editor pane */}
        {(activeTab === "edit" || activeTab === "split") && (
          <div className={`${activeTab === "split" ? "w-1/2 border-r border-[var(--border)]" : "w-full"} flex flex-col overflow-hidden`}>
            <Editor
              value={editorContent}
              onChange={handleEditorChange}
              language={editorLanguage}
              darkMode={darkMode}
            />
          </div>
        )}

        {/* Preview pane */}
        {(activeTab === "docs" || activeTab === "split") && (
          <div className={`${activeTab === "split" ? "w-1/2" : "w-full"} overflow-auto`}>
            <ApiPreview spec={parsedSpec} error={parseError} />
          </div>
        )}
      </div>
    </div>
  );
}

function generateHtmlExport(spec: OpenAPISpec | null): string {
  if (!spec) return "<html><body><p>No API spec loaded</p></body></html>";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${spec.info.title} - API Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.5rem; margin: 2rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #eee; }
    h3 { font-size: 1.1rem; margin: 1rem 0 0.5rem; }
    .version { display: inline-block; background: #e8f4fd; color: #1a73e8; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: 600; }
    .endpoint { border: 1px solid #e0e0e0; border-radius: 8px; margin: 1rem 0; overflow: hidden; }
    .endpoint-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fafafa; }
    .method { padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: white; }
    .method-get { background: #40c057; }
    .method-post { background: #339af0; }
    .method-put { background: #fd7e14; }
    .method-patch { background: #f59f00; }
    .method-delete { background: #fa5252; }
    .path { font-family: monospace; font-weight: 600; }
    .summary { color: #666; font-size: 0.9rem; }
    .description { padding: 12px 16px; color: #555; font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 0.85rem; }
    th { background: #fafafa; font-weight: 600; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 0.85rem; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 6px; overflow-x: auto; font-size: 0.85rem; margin: 0.5rem 0; }
    .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #eee; color: #999; font-size: 0.8rem; }
  </style>
</head>
<body>
  <h1>${spec.info.title}</h1>
  <span class="version">v${spec.info.version}</span>
  ${spec.info.description ? `<p style="margin-top:1rem;color:#555">${spec.info.description}</p>` : ""}
  ${spec.servers?.[0] ? `<p style="margin-top:0.5rem"><code>${spec.servers[0].url}</code></p>` : ""}

  ${Object.entries(spec.paths || {})
    .map(
      ([path, methods]) =>
        Object.entries(methods as Record<string, { summary?: string; description?: string }>)
          .filter(([m]) => ["get", "post", "put", "patch", "delete"].includes(m))
          .map(
            ([method, op]) => `
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method method-${method}">${method}</span>
        <span class="path">${path}</span>
        ${op.summary ? `<span class="summary">— ${op.summary}</span>` : ""}
      </div>
      ${op.description ? `<div class="description">${op.description}</div>` : ""}
    </div>`
          )
          .join("")
    )
    .join("")}

  <div class="footer">
    Generated by API Canvas
  </div>
</body>
</html>`;
}
