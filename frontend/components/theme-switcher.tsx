"use client";

import { useTheme } from "./theme-provider";

const OPTIONS = [
  { value: "light" as const, label: "Светлая", icon: "☀" },
  { value: "dark" as const, label: "Тёмная", icon: "☾" },
  { value: "system" as const, label: "Системная", icon: "◐" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1" aria-label="Тема оформления">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setTheme(option.value)}
          aria-label={option.label}
          aria-pressed={theme === option.value}
          title={option.label}
          className={`rounded px-2 py-1 text-sm transition-colors ${theme === option.value ? "bg-accent text-ink" : "text-muted hover:text-text"}`}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
