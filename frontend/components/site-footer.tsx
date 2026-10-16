"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function SiteFooter() {
  const [settings, setSettings] = useState<{ telegram_url?: string; avito_url?: string; address?: string }>({});
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/site-settings`, { cache: "no-store", signal: controller.signal })
      .then((res) => { if (!res.ok) throw new Error("Failed to load settings"); return res.json(); })
      .then(setSettings)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-10 font-sans text-sm text-muted">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span>CustomPS{settings.address ? ` · ${settings.address}` : ""}</span>
          <div className="flex gap-6">
            <Link href="/contacts" className="hover:text-text">Контакты</Link>
            {settings.telegram_url && <a href={settings.telegram_url} target="_blank" rel="noopener noreferrer" className="hover:text-text">Telegram</a>}
            {settings.avito_url && <a href={settings.avito_url} target="_blank" rel="noopener noreferrer" className="hover:text-text">Авито</a>}
          </div>
        </div>
      </div>
    </footer>
  );
}
