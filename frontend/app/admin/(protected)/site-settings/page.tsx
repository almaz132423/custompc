"use client";

import { useEffect, useState } from "react";
import { getSiteSettings, updateSiteSetting, type SiteSetting } from "@/lib/api";

const fields = [
  { key: "phone", label: "Телефон", placeholder: "+7 (000) 000-00-00" },
  { key: "telegram_url", label: "Telegram", placeholder: "https://t.me/..." },
  { key: "avito_url", label: "Авито", placeholder: "https://www.avito.ru/..." },
  { key: "email", label: "Email", placeholder: "mail@example.com" },
  { key: "address", label: "Адрес", placeholder: "Город, улица, дом" },
  { key: "work_hours", label: "Часы работы", placeholder: "Пн–Пт: 10:00–19:00" },
] as const;

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getSiteSettings();
      setSettings(Object.fromEntries(data.map((item) => [item.key, item.value])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить настройки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save(key: string) {
    setSaving(key);
    setMessage("");
    setError("");
    try {
      const saved = await updateSiteSetting(key, settings[key] ?? "");
      setSettings((current) => ({ ...current, [key]: saved.value }));
      setMessage("Настройки сохранены.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить настройку");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl font-semibold">Настройки сайта</h1>
        <p className="mt-2 text-sm text-muted">
          Контакты и внешние ссылки, которые можно менять без изменения кода.
        </p>
      </div>

      {message && <div className="mt-6 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm">{message}</div>}
      {error && <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">{error}</div>}

      {loading ? (
        <p className="mt-8 text-sm text-muted">Загрузка…</p>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <section key={field.key} className="rounded-md border border-border p-5">
              <label className="block">
                <span className="text-sm font-medium">{field.label}</span>
                <input
                  value={settings[field.key] ?? ""}
                  onChange={(event) => setSettings((current) => ({ ...current, [field.key]: event.target.value }))}
                  placeholder={field.placeholder}
                  className="admin-input mt-2"
                />
              </label>
              <button
                type="button"
                onClick={() => save(field.key)}
                disabled={saving !== null}
                className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving === field.key ? "Сохраняем…" : "Сохранить"}
              </button>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
