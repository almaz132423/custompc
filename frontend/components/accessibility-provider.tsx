"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AccessibilitySettings = {
  fontSize: "normal" | "large" | "xlarge";
  highContrast: boolean;
  reduceMotion: boolean;
  readableFont: boolean;
};

type AccessibilityContextValue = AccessibilitySettings & {
  setFontSize: (value: AccessibilitySettings["fontSize"]) => void;
  setHighContrast: (value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
  setReadableFont: (value: boolean) => void;
  reset: () => void;
};

const STORAGE_KEY = "customps-accessibility";
const DEFAULTS: AccessibilitySettings = {
  fontSize: "normal",
  highContrast: false,
  reduceMotion: false,
  readableFont: false,
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function applySettings(settings: AccessibilitySettings) {
  const root = document.documentElement;
  root.dataset.fontSize = settings.fontSize;
  root.dataset.highContrast = settings.highContrast ? "true" : "false";
  root.dataset.reduceMotion = settings.reduceMotion ? "true" : "false";
  root.dataset.readableFont = settings.readableFont ? "true" : "false";
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULTS);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<AccessibilitySettings>;
        const next = {
          ...DEFAULTS,
          ...parsed,
          fontSize: parsed.fontSize === "large" || parsed.fontSize === "xlarge" ? parsed.fontSize : "normal",
        };
        setSettings(next);
        applySettings(next);
        return;
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    applySettings(DEFAULTS);
  }, []);

  useEffect(() => {
    applySettings(settings);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const value = useMemo<AccessibilityContextValue>(() => ({
    ...settings,
    setFontSize: (value) => update("fontSize", value),
    setHighContrast: (value) => update("highContrast", value),
    setReduceMotion: (value) => update("reduceMotion", value),
    setReadableFont: (value) => update("readableFont", value),
    reset: () => setSettings(DEFAULTS),
  }), [settings]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error("useAccessibility must be used inside AccessibilityProvider");
  return context;
}
