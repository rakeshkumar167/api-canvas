"use client";

import { Eye, Code2, Columns2 } from "lucide-react";

export type ViewTab = "docs" | "edit" | "split";

interface TabBarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
}

const tabs: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
  { id: "docs", label: "Docs", icon: <Eye className="w-4 h-4" /> },
  { id: "edit", label: "Edit", icon: <Code2 className="w-4 h-4" /> },
  { id: "split", label: "Split", icon: <Columns2 className="w-4 h-4" /> },
];

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex items-center h-10 px-4 gap-1 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all
            ${
              activeTab === tab.id
                ? "bg-[var(--accent)] text-white font-medium shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
            }
          `}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}

      <div className="flex-1" />

      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-tertiary)] font-mono">
          Ctrl+1
        </kbd>
        <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-tertiary)] font-mono">
          Ctrl+2
        </kbd>
        <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-tertiary)] font-mono">
          Ctrl+3
        </kbd>
      </div>
    </div>
  );
}
