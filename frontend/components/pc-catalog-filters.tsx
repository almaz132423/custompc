"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const purposes = [
  ["GAMES", "Игры"],
  ["WORK", "Работа"],
  ["MONTAGE", "Монтаж"],
  ["THREE_D", "3D"],
  ["STREAMING", "Стриминг"],
  ["AI", "AI"],
  ["UNIVERSAL", "Универсальный"],
] as const;

const resolutions = [
  ["R1080P", "1080p"],
  ["R1440P", "1440p"],
  ["R4K", "4K"],
] as const;

export function PcCatalogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const value = (key: string) => searchParams.get(key) ?? "";

  function apply(key: string, nextValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextValue) params.set(key, nextValue);
    else params.delete(key);
    router.push(`/pc${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function reset() {
    router.push("/pc");
  }

  const activeCount = ["minPrice", "maxPrice", "purpose", "gpu", "cpu", "minRam", "minStorage", "resolution", "sort"]
    .filter((key) => searchParams.has(key)).length;

  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded border border-border px-3 py-2 text-sm hover:border-accent"
        >
          Фильтры{activeCount ? ` (${activeCount})` : ""}
        </button>
        <button
          type="button"
          onClick={reset}
          className="text-sm text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          Сбросить
        </button>
      </div>

      {open && (
        <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Цена, от ₽</span>
            <input value={value("minPrice")} onChange={(e) => apply("minPrice", e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="например, 100000" className="rounded border border-border bg-ink px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Цена, до ₽</span>
            <input value={value("maxPrice")} onChange={(e) => apply("maxPrice", e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="например, 300000" className="rounded border border-border bg-ink px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Процессор</span>
            <input value={value("cpu")} onChange={(e) => apply("cpu", e.target.value)} placeholder="Ryzen 7, Core i5..." className="rounded border border-border bg-ink px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Видеокарта</span>
            <input value={value("gpu")} onChange={(e) => apply("gpu", e.target.value)} placeholder="RTX 5070, RX 9070..." className="rounded border border-border bg-ink px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">ОЗУ от, ГБ</span>
            <select value={value("minRam")} onChange={(e) => apply("minRam", e.target.value)} className="rounded border border-border bg-ink px-3 py-2">
              <option value="">Любой объём</option>
              <option value="16">16 ГБ</option>
              <option value="32">32 ГБ</option>
              <option value="64">64 ГБ</option>
              <option value="128">128 ГБ</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Накопитель от, ГБ</span>
            <select value={value("minStorage")} onChange={(e) => apply("minStorage", e.target.value)} className="rounded border border-border bg-ink px-3 py-2">
              <option value="">Любой объём</option>
              <option value="512">512 ГБ</option>
              <option value="1024">1 ТБ</option>
              <option value="2048">2 ТБ</option>
              <option value="4096">4 ТБ</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Назначение</span>
            <select value={value("purpose")} onChange={(e) => apply("purpose", e.target.value)} className="rounded border border-border bg-ink px-3 py-2">
              <option value="">Любое</option>
              {purposes.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Разрешение</span>
            <select value={value("resolution")} onChange={(e) => apply("resolution", e.target.value)} className="rounded border border-border bg-ink px-3 py-2">
              <option value="">Любое</option>
              {resolutions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Сортировка</span>
            <select value={value("sort") || "newest"} onChange={(e) => apply("sort", e.target.value === "newest" ? "" : e.target.value)} className="rounded border border-border bg-ink px-3 py-2">
              <option value="newest">Сначала новые</option>
              <option value="price-asc">Сначала дешевле</option>
              <option value="price-desc">Сначала дороже</option>
            </select>
          </label>
        </div>
      )}
    </section>
  );
}
