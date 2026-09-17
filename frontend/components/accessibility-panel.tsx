"use client";

import { useState } from "react";
import { useAccessibility } from "./accessibility-provider";

export function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const { fontSize, highContrast, reduceMotion, readableFont, setFontSize, setHighContrast, setReduceMotion, setReadableFont, reset } = useAccessibility();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="accessibility-panel"
        className="rounded-md border border-border px-3 py-2 text-sm text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Доступность
      </button>
      {open && (
        <div id="accessibility-panel" role="dialog" aria-label="Настройки доступности" className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-surface p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold">Настройки доступности</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть настройки доступности" className="text-xl leading-none text-muted hover:text-text">×</button>
          </div>

          <fieldset className="mb-4">
            <legend className="mb-2 text-sm font-medium">Размер текста</legend>
            <div className="grid grid-cols-3 gap-2">
              {(["normal", "large", "xlarge"] as const).map((value) => (
                <button key={value} type="button" aria-pressed={fontSize === value} onClick={() => setFontSize(value)} className="rounded-md border border-border px-2 py-2 text-sm hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent-soft">
                  {value === "normal" ? "100%" : value === "large" ? "115%" : "130%"}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-3 text-sm">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span>Высокий контраст</span>
              <input type="checkbox" checked={highContrast} onChange={(event) => setHighContrast(event.target.checked)} className="h-5 w-5" />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span>Уменьшить анимацию</span>
              <input type="checkbox" checked={reduceMotion} onChange={(event) => setReduceMotion(event.target.checked)} className="h-5 w-5" />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span>Читаемый шрифт</span>
              <input type="checkbox" checked={readableFont} onChange={(event) => setReadableFont(event.target.checked)} className="h-5 w-5" />
            </label>
          </div>

          <button type="button" onClick={reset} className="mt-5 w-full rounded-md border border-border px-3 py-2 text-sm text-muted hover:text-text">
            Сбросить настройки
          </button>
        </div>
      )}
    </div>
  );
}
