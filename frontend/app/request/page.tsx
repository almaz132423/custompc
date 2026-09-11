"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const PURPOSE_OPTIONS = [
  { value: "GAMES", label: "Игры" },
  { value: "WORK", label: "Работа" },
  { value: "MONTAGE", label: "Монтаж" },
  { value: "THREE_D", label: "3D" },
  { value: "STREAMING", label: "Стриминг" },
  { value: "AI", label: "AI" },
  { value: "UNIVERSAL", label: "Универсальный" },
];

const leadSchema = z.object({
  name: z.string().min(2, "Введите имя"),
  contact: z.string().min(5, "Введите телефон или Telegram"),
  budget: z.string().optional(),
  purpose: z.string().optional(),
  comment: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function RequestForm() {
  const searchParams = useSearchParams();

  const prefillPurpose = searchParams.get("purpose") ?? "";
  const prefillBudget = searchParams.get("budget") ?? "";
  const prefillResolution = searchParams.get("resolution") ?? "";
  const prefillPriority = searchParams.get("priority") ?? "";
  const pcBuildId = searchParams.get("pcBuildId") ?? "";
  const category = searchParams.get("category") ?? "";

  const hasConfiguratorData = Boolean(
    prefillPurpose || prefillResolution || prefillPriority,
  );

  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      purpose: prefillPurpose || undefined,
      budget: prefillBudget || undefined,
    },
  });

  async function onSubmit(values: LeadFormValues) {
    setStatus("sending");
    try {
      const res = await fetch(`${API_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          category: category || undefined,
          pcBuildId: pcBuildId || undefined,
          configuration: hasConfiguratorData
            ? {
                purpose: prefillPurpose || undefined,
                budget: prefillBudget || undefined,
                resolution: prefillResolution || undefined,
                priority: prefillPriority || undefined,
              }
            : undefined,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-3xl font-semibold">Спасибо!</h1>
        <p className="mt-4 text-muted">
          Заявка получена. Мы свяжемся с вами для уточнения конфигурации.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      {category && (
        <span className="inline-block rounded border border-accent px-2 py-1 font-mono text-xs text-accent">
          {category}
        </span>
      )}

      <h1 className="mt-3 font-display text-3xl font-semibold">
        Получить расчёт
      </h1>
      <p className="mt-3 text-muted">
        {hasConfiguratorData
          ? "Мы сохранили параметры из конфигуратора — просто оставьте контакты."
          : "Оставьте контакты — подберём конфигурацию и посчитаем стоимость."}
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-10 flex flex-col gap-5"
      >
        <div>
          <label className="block font-mono text-xs text-muted">Имя *</label>
          <input
            {...register("name")}
            className="mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block font-mono text-xs text-muted">
            Телефон / Telegram *
          </label>
          <input
            {...register("contact")}
            className="mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
          />
          {errors.contact && (
            <p className="mt-1 text-xs text-red-400">
              {errors.contact.message}
            </p>
          )}
        </div>

        <div>
          <label className="block font-mono text-xs text-muted">Бюджет</label>
          <input
            {...register("budget")}
            placeholder="Например, 150000"
            className="mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-muted">
            Назначение
          </label>
          <select
            {...register("purpose")}
            className="mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
          >
            <option value="">Не важно</option>
            {PURPOSE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-mono text-xs text-muted">
            Комментарий
          </label>
          <textarea
            {...register("comment")}
            rows={4}
            className="mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
          />
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-4 rounded-md bg-accent px-6 py-3 font-sans text-sm font-medium text-ink transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {status === "sending" ? "Отправляем..." : "Получить расчёт"}
        </button>

        {status === "error" && (
          <p className="text-sm text-red-400">
            Не получилось отправить заявку. Проверь, что backend запущен, и
            попробуй ещё раз.
          </p>
        )}
      </form>
    </div>
  );
}

export default function RequestPage() {
  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />
      <main className="px-6 py-20">
        <Suspense fallback={<p className="text-center text-muted">Загрузка…</p>}>
          <RequestForm />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}