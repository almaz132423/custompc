"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Контакты пока захардкожены. По разделу 41 ТЗ их нужно редактировать из
// админки без правки кода (через SiteSettings) — перенесём туда, когда
// дойдём до раздела "Управление контентом".
const CONTACTS = {
  city: "Нефтекамск, Республика Башкортостан",
  phone: "+7 (000) 000-00-00",
  telegram: "https://t.me/customps",
  avito: "https://www.avito.ru",
};

export default function ContactsPage() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [comment, setComment] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(`${API_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contact,
          comment,
          category: "Общий вопрос",
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("success");
      setName("");
      setContact("");
      setComment("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold">Контакты</h1>
        <p className="mt-3 text-muted">{CONTACTS.city}</p>

        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <dl className="flex flex-col gap-5">
              <div>
                <dt className="font-mono text-xs text-muted">Телефон</dt>
                <dd className="mt-1">
                  <a
                    href={`tel:${CONTACTS.phone.replace(/[^\d+]/g, "")}`}
                    className="font-mono text-lg text-accent hover:text-accent-hover"
                  >
                    {CONTACTS.phone}
                  </a>
                </dd>
              </div>

              <div>
                <dt className="font-mono text-xs text-muted">Telegram</dt>
                <dd className="mt-1">
                  <a
                    href={CONTACTS.telegram}
                    target="_blank"
                    className="text-accent hover:text-accent-hover"
                  >
                    Написать в Telegram
                  </a>
                </dd>
              </div>

              <div>
                <dt className="font-mono text-xs text-muted">Авито</dt>
                <dd className="mt-1">
                  <a
                    href={CONTACTS.avito}
                    target="_blank"
                    className="text-accent hover:text-accent-hover"
                  >
                    Смотреть объявления
                  </a>
                </dd>
              </div>

              <div>
                <dt className="font-mono text-xs text-muted">Город</dt>
                <dd className="mt-1 text-text">{CONTACTS.city}</dd>
              </div>
            </dl>

            <div className="mt-8 flex aspect-video items-center justify-center rounded-md border border-border bg-surface font-mono text-sm text-muted">
              карта (Яндекс/2ГИС)
            </div>
          </div>

          <div>
            {status === "success" ? (
              <div className="flex h-full flex-col items-center justify-center rounded-md border border-border bg-surface p-8 text-center">
                <p className="font-display text-lg font-semibold">
                  Спасибо!
                </p>
                <p className="mt-2 text-sm text-muted">
                  Сообщение получено, скоро свяжемся с вами.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <h2 className="font-display text-lg font-semibold">
                  Написать нам
                </h2>

                <div>
                  <label className="block font-mono text-xs text-muted">
                    Имя *
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs text-muted">
                    Телефон / Telegram *
                  </label>
                  <input
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs text-muted">
                    Сообщение
                  </label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="mt-2 rounded-md bg-accent px-6 py-3 font-sans text-sm font-medium text-ink transition-colors hover:bg-accent-hover disabled:opacity-60"
                >
                  {status === "sending" ? "Отправляем..." : "Отправить"}
                </button>

                {status === "error" && (
                  <p className="text-sm text-red-400">
                    Не получилось отправить. Проверь, что backend запущен.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
