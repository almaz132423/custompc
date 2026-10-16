"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeSwitcher } from "./theme-switcher";
import { AccessibilityPanel } from "./accessibility-panel";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const NAV_LINKS = [
  { href: "/pc", label: "Каталог ПК" },
  { href: "/configurator", label: "Конфигуратор" },
  { href: "/services", label: "Услуги" },
  { href: "/portfolio", label: "Портфолио" },
  { href: "/reviews", label: "Отзывы" },
  { href: "/about", label: "О компании" },
  { href: "/contacts", label: "Контакты" },
];

export function SiteHeader() {
  const [avitoUrl, setAvitoUrl] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/site-settings`, { cache: "no-store", signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Settings unavailable");
        return res.json() as Promise<{ avito_url?: string }>;
      })
      .then((settings) => setAvitoUrl(settings.avito_url || null))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="shrink-0 font-display text-lg font-semibold">
          CustomPS
        </Link>

        <nav className="hidden items-center gap-6 font-sans text-sm text-muted md:flex" aria-label="Основная навигация">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <AccessibilityPanel />
          <ThemeSwitcher />
          {avitoUrl && (
            <a
              href={avitoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden font-sans text-sm text-muted transition-colors hover:text-text sm:block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Авито
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
