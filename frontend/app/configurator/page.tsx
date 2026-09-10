"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getRecommendation,
  formatPrice,
  purposeLabel,
  resolutionLabel,
  type PCBuild,
} from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const PURPOSES = [
  { value: "GAMES", label: "Игры" },
  { value: "WORK", label: "Работа" },
  { value: "MONTAGE", label: "Монтаж" },
  { value: "THREE_D", label: "3D" },
  { value: "STREAMING", label: "Стриминг" },
  { value: "AI", label: "AI" },
  { value: "UNIVERSAL", label: "Универсальный" },
];

const RESOLUTIONS = [
  { value: "R1080P", label: "1080p" },
  { value: "R1440P", label: "1440p" },
  { value: "R4K", label: "4K" },
];

const PRIORITIES = [
  { value: "MAX_FPS", label: "Максимум FPS" },
  { value: "PRICE_PERFORMANCE", label: "Цена/производительность" },
  { value: "SILENCE", label: "Тишина" },
  { value: "APPEARANCE", label: "Внешний вид" },
  { value: "UPGRADABILITY", label: "Возможность апгрейда" },
];

const STEP_LABELS = [
  "Назначение",
  "Бюджет",
  "Разрешение",
  "Приоритет",
  "Результат",
];

type Answers = {
  purpose: string;
  budget: number;
  resolution: string;
  priority: string;
};

export default function ConfiguratorPage() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    purpose: "",
    budget: 150000,
    resolution: "",
    priority: "",
  });
  const [result, setResult] = useState<PCBuild | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  function next() {
    setStep((s) => Math.min(s + 1, 5));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function reset() {
    setStep(1);
    setAnswers({ purpose: "", budget: 150000, resolution: "", priority: "" });
    setResult(undefined);
  }

  async function finish(priority: string) {
    setAnswers((a) => ({ ...a, priority }));
    setStep(5);
    setLoading(true);
    const recommendation = await getRecommendation({
      purpose: answers.purpose,
      budget: String(answers.budget),
      resolution: answers.resolution,
      priority,
    });
    setResult(recommendation);
    setLoading(false);
  }

  const requestHref = `/request?category=${encodeURIComponent("Конфигуратор")}&purpose=${answers.purpose}&budget=${answers.budget}&resolution=${answers.resolution}&priority=${answers.priority}`;

  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-6 py-16">
        {/* Индикатор шагов — реальная последовательность из раздела 18 ТЗ */}
        <div className="flex flex-wrap items-center gap-1 font-mono text-xs text-muted">
          {STEP_LABELS.map((label, index) => (
            <span
              key={label}
              className={
                index + 1 === step
                  ? "text-accent"
                  : index + 1 < step
                    ? "text-text"
                    : ""
              }
            >
              {index + 1}. {label}
              {index < STEP_LABELS.length - 1 && (
                <span className="mx-2 text-border">/</span>
              )}
            </span>
          ))}
        </div>

        {step === 1 && (
          <div className="mt-10">
            <h1 className="font-display text-2xl font-semibold">
              Для чего нужен компьютер?
            </h1>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PURPOSES.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers((a) => ({ ...a, purpose: option.value }));
                    next();
                  }}
                  className={`rounded-md border px-4 py-6 text-center font-sans text-sm transition-colors ${
                    answers.purpose === option.value
                      ? "border-accent bg-accent-soft"
                      : "border-border hover:border-accent hover:bg-surface"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-10">
            <h1 className="font-display text-2xl font-semibold">
              Ваш бюджет
            </h1>
            <p className="mt-6 font-mono text-3xl text-accent">
              {formatPrice(String(answers.budget))}
            </p>
            <input
              type="range"
              min={50000}
              max={500000}
              step={5000}
              value={answers.budget}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, budget: Number(e.target.value) }))
              }
              className="mt-6 w-full"
            />
            <div className="mt-2 flex justify-between font-mono text-xs text-muted">
              <span>50 000 ₽</span>
              <span>500 000 ₽</span>
            </div>

            <div className="mt-10 flex gap-4">
              <button
                onClick={back}
                className="rounded-md border border-border px-6 py-3 font-sans text-sm transition-colors hover:border-accent"
              >
                Назад
              </button>
              <button
                onClick={next}
                className="rounded-md bg-accent px-6 py-3 font-sans text-sm font-medium text-ink transition-colors hover:bg-accent-hover"
              >
                Далее
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-10">
            <h1 className="font-display text-2xl font-semibold">
              Разрешение экрана
            </h1>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {RESOLUTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers((a) => ({ ...a, resolution: option.value }));
                    next();
                  }}
                  className={`rounded-md border px-4 py-6 text-center font-mono text-sm transition-colors ${
                    answers.resolution === option.value
                      ? "border-accent bg-accent-soft"
                      : "border-border hover:border-accent hover:bg-surface"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={back}
              className="mt-10 rounded-md border border-border px-6 py-3 font-sans text-sm transition-colors hover:border-accent"
            >
              Назад
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="mt-10">
            <h1 className="font-display text-2xl font-semibold">
              Что важнее всего?
            </h1>
            <div className="mt-8 flex flex-col gap-3">
              {PRIORITIES.map((option) => (
                <button
                  key={option.value}
                  onClick={() => finish(option.value)}
                  className={`rounded-md border px-5 py-4 text-left font-sans text-sm transition-colors ${
                    answers.priority === option.value
                      ? "border-accent bg-accent-soft"
                      : "border-border hover:border-accent hover:bg-surface"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={back}
              className="mt-10 rounded-md border border-border px-6 py-3 font-sans text-sm transition-colors hover:border-accent"
            >
              Назад
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="mt-10">
            {loading && <p className="text-muted">Подбираем конфигурацию…</p>}

            {!loading && result === null && (
              <div>
                <p className="text-muted">
                  Не нашли готовую сборку под эти параметры — но точно
                  подберём индивидуально.
                </p>
                <Link
                  href={requestHref}
                  className="mt-6 inline-block rounded-md bg-accent px-6 py-3 font-sans text-sm font-medium text-ink transition-colors hover:bg-accent-hover"
                >
                  Отправить конфигурацию
                </Link>
              </div>
            )}

            {!loading && result && (
              <div>
                <p className="font-mono text-xs text-accent">ВАМ ПОДОЙДЁТ</p>
                <h1 className="mt-2 font-display text-3xl font-semibold">
                  {result.name}
                </h1>

                <div className="mt-5 flex flex-wrap gap-2 font-mono text-xs text-muted">
                  <span className="rounded border border-border px-2 py-1">
                    {purposeLabel(result.purpose)}
                  </span>
                  {resolutionLabel(result.resolution) && (
                    <span className="rounded border border-border px-2 py-1">
                      {resolutionLabel(result.resolution)}
                    </span>
                  )}
                </div>

                {result.description && (
                  <p className="mt-5 text-muted">{result.description}</p>
                )}

                <p className="mt-6 font-mono text-xs text-muted">
                  Ориентировочная стоимость
                </p>
                <p className="font-mono text-3xl text-accent">
                  {formatPrice(result.price)}
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href={requestHref}
                    className="rounded-md bg-accent px-6 py-3 font-sans text-sm font-medium text-ink transition-colors hover:bg-accent-hover"
                  >
                    Отправить конфигурацию
                  </Link>
                  <button
                    onClick={reset}
                    className="rounded-md border border-border px-6 py-3 font-sans text-sm transition-colors hover:border-accent"
                  >
                    Изменить конфигурацию
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
