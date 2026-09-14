"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatPrice, type Component, type ComponentCategory, type CompatibilityIssue } from "@/lib/api";
import { getConfiguratorCategories, getConfiguratorComponents, validateConfigurator } from "@/lib/configurator-api";

const CATEGORY_ORDER = ["CPU", "MOTHERBOARD", "RAM", "GPU", "SSD", "PSU", "CASE", "COOLING"];
const CATEGORY_LABELS: Record<string, string> = {
  CPU: "Процессор",
  MOTHERBOARD: "Материнская плата",
  RAM: "Оперативная память",
  GPU: "Видеокарта",
  SSD: "Накопитель",
  PSU: "Блок питания",
  CASE: "Корпус",
  COOLING: "Охлаждение",
};

type Selection = Record<string, Component | undefined>;

export default function ConfiguratorPage() {
  const [categories, setCategories] = useState<ComponentCategory[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [selection, setSelection] = useState<Selection>({});
  const [activeCode, setActiveCode] = useState("CPU");
  const [issues, setIssues] = useState<CompatibilityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getConfiguratorCategories(), getConfiguratorComponents()])
      .then(([loadedCategories, loadedComponents]) => {
        setCategories(loadedCategories.filter((category) => CATEGORY_ORDER.includes(category.code)));
        setComponents(loadedComponents);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Не удалось загрузить конфигуратор"))
      .finally(() => setLoading(false));
  }, []);

  const orderedCategories = useMemo(
    () => [...categories].sort((a, b) => CATEGORY_ORDER.indexOf(a.code) - CATEGORY_ORDER.indexOf(b.code)),
    [categories],
  );

  const activeCategory = orderedCategories.find((category) => category.code === activeCode) ?? orderedCategories[0];
  const activeComponents = components.filter((component) => component.categoryId === activeCategory?.id);
  const selectedComponents = orderedCategories.map((category) => selection[category.code]).filter(Boolean) as Component[];
  const total = selectedComponents.reduce((sum, component) => sum + Number(component.price), 0);
  const completed = selectedComponents.length;
  const requestConfig = encodeURIComponent(JSON.stringify({
    type: "CUSTOM_CONFIG",
    componentIds: selectedComponents.map((component) => component.id),
    components: selectedComponents.map((component) => ({
      id: component.id,
      category: component.category.code,
      categoryName: CATEGORY_LABELS[component.category.code] ?? component.category.name,
      manufacturer: component.manufacturer,
      model: component.model,
      price: component.price,
    })),
    total: String(total),
  }));
  const requestHref = `/request?category=${encodeURIComponent("Конфигуратор")}&budget=${total}&configuration=${requestConfig}`;

  async function selectComponent(component: Component) {
    const nextSelection = { ...selection, [component.category.code]: component };
    setSelection(nextSelection);
    setIssues([]);
    const ids = Object.values(nextSelection).filter(Boolean).map((item) => (item as Component).id);
    setChecking(true);
    try {
      const result = await validateConfigurator(ids);
      setIssues(result.issues);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось проверить совместимость");
    } finally {
      setChecking(false);
    }
  }

  function clearSelection(code: string) {
    const next = { ...selection };
    delete next[code];
    setSelection(next);
    setIssues([]);
  }

  function nextCategory() {
    const index = orderedCategories.findIndex((category) => category.code === activeCategory?.code);
    if (index >= 0 && index < orderedCategories.length - 1) setActiveCode(orderedCategories[index + 1].code);
  }

  if (loading) {
    return <div className="min-h-screen bg-ink"><SiteHeader /><main className="mx-auto max-w-6xl px-6 py-20 text-muted">Загрузка конфигуратора…</main><SiteFooter /></div>;
  }

  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <div className="max-w-3xl">
          <p className="font-mono text-xs text-accent">CUSTOM PC</p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Соберите ПК под себя</h1>
          <p className="mt-4 text-muted">Выбирайте комплектующие по очереди. После каждого выбора сервер проверяет конфигурацию на совместимость.</p>
        </div>

        {error && <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-300">{error}</div>}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section>
            <div className="flex flex-wrap gap-2">
              {orderedCategories.map((category, index) => {
                const selected = selection[category.code];
                return (
                  <button key={category.id} onClick={() => setActiveCode(category.code)} className={`rounded-md border px-3 py-2 text-left font-mono text-xs transition-colors ${activeCategory?.code === category.code ? "border-accent bg-accent-soft text-accent" : "border-border hover:border-accent"}`}>
                    <span>{index + 1}. {CATEGORY_LABELS[category.code] ?? category.name}</span>
                    <span className="ml-2 text-muted">{selected ? "✓" : "—"}</span>
                  </button>
                );
              })}
            </div>

            {activeCategory && (
              <div className="mt-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-muted">ШАГ {orderedCategories.findIndex((category) => category.code === activeCategory.code) + 1} ИЗ {orderedCategories.length}</p>
                    <h2 className="mt-1 font-display text-2xl font-semibold">{CATEGORY_LABELS[activeCategory.code] ?? activeCategory.name}</h2>
                  </div>
                  {selection[activeCategory.code] && <button onClick={() => clearSelection(activeCategory.code)} className="text-xs text-muted hover:text-text">Сбросить</button>}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {activeComponents.map((component) => {
                    const selected = selection[component.category.code]?.id === component.id;
                    const blocked = issues.some((issue) => issue.componentIds?.includes(component.id));
                    return (
                      <button key={component.id} onClick={() => selectComponent(component)} className={`rounded-md border p-4 text-left transition-colors ${selected ? "border-accent bg-accent-soft" : "border-border hover:border-accent"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-xs text-muted">{component.manufacturer}</p>
                            <p className="mt-1 font-medium">{component.model}</p>
                          </div>
                          {selected && <span className="font-mono text-xs text-accent">✓</span>}
                        </div>
                        <div className="mt-4 flex items-center justify-between font-mono text-sm">
                          <span className="text-accent">{formatPrice(component.price)}</span>
                          {blocked && <span className="text-red-300">Проблема</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex gap-3">
                  {orderedCategories.findIndex((category) => category.code === activeCategory.code) > 0 && (
                    <button onClick={() => setActiveCode(orderedCategories[orderedCategories.findIndex((category) => category.code === activeCategory.code) - 1].code)} className="rounded-md border border-border px-5 py-3 text-sm hover:border-accent">Назад</button>
                  )}
                  {orderedCategories.findIndex((category) => category.code === activeCategory.code) < orderedCategories.length - 1 && (
                    <button onClick={nextCategory} className="rounded-md bg-accent px-5 py-3 text-sm font-medium text-ink hover:bg-accent-hover">Далее</button>
                  )}
                </div>
              </div>
            )}
          </section>

          <aside className="h-fit rounded-md border border-border bg-surface p-5 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs text-muted">ВАША КОНФИГУРАЦИЯ</p>
              <span className="font-mono text-xs text-muted">{completed}/{orderedCategories.length}</span>
            </div>
            <p className="mt-3 font-mono text-2xl text-accent">{formatPrice(String(total))}</p>

            <div className="mt-5 space-y-3">
              {orderedCategories.map((category) => {
                const component = selection[category.code];
                return <div key={category.id} className="border-b border-border pb-3 last:border-0"><p className="font-mono text-[11px] text-muted">{CATEGORY_LABELS[category.code] ?? category.name}</p><p className="mt-1 text-sm">{component ? `${component.manufacturer} ${component.model}` : "Не выбрано"}</p></div>;
              })}
            </div>

            {checking && <p className="mt-5 text-xs text-muted">Проверяем совместимость…</p>}
            {!checking && issues.length > 0 && (
              <div className="mt-5 rounded-md border border-red-500/40 bg-red-500/5 p-4">
                <p className="font-mono text-xs text-red-300">НЕСОВМЕСТИМО</p>
                <ul className="mt-2 space-y-2 text-xs text-red-200">{issues.map((issue, index) => <li key={`${issue.message}-${index}`}>• {issue.message}</li>)}</ul>
              </div>
            )}
            {!checking && issues.length === 0 && completed > 0 && <p className="mt-5 text-xs text-accent">✓ Выбранные компоненты совместимы</p>}

            <Link href={completed > 0 && issues.length === 0 ? requestHref : "#"} onClick={(event) => { if (completed === 0 || issues.length > 0) event.preventDefault(); }} className={`mt-6 block rounded-md px-5 py-3 text-center text-sm font-medium ${completed > 0 && issues.length === 0 ? "bg-accent text-ink hover:bg-accent-hover" : "cursor-not-allowed bg-border text-muted"}`}>
              Отправить конфигурацию
            </Link>
            <p className="mt-3 text-center text-xs text-muted">Можно оставить незаполненные позиции — менеджер поможет подобрать их.</p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
