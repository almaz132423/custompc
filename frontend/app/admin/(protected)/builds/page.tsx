"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatPrice,
  getAdminBuilds,
  getBuildCompatibility,
  getComponents,
  removeBuildComponent,
  setBuildComponent,
  type AdminBuild,
  type CompatibilityResult,
  type Component,
} from "@/lib/api";

export default function AdminBuildsPage() {
  const [builds, setBuilds] = useState<AdminBuild[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedBuildId, setSelectedBuildId] = useState("");
  const [selectedComponentId, setSelectedComponentId] = useState("");
  const [componentSearch, setComponentSearch] = useState("");
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [componentsTotal, setComponentsTotal] = useState(0);
  const [quantity, setQuantity] = useState("1");
  const [compatibility, setCompatibility] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedBuild = useMemo(
    () => builds.find((build) => build.id === selectedBuildId) ?? null,
    [builds, selectedBuildId],
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      const loadedBuilds = await getAdminBuilds();
      setBuilds(loadedBuilds);
      setSelectedBuildId((current) => current || loadedBuilds[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function checkCompatibility() {
    if (!selectedBuildId) return;
    setChecking(true);
    setError("");
    try {
      setCompatibility(await getBuildCompatibility(selectedBuildId));
    } catch (err) {
      setCompatibility(null);
      setError(err instanceof Error ? err.message : "Не удалось проверить совместимость");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (selectedBuildId) checkCompatibility();
  }, [selectedBuildId]);

  async function addComponent() {
    const count = Number(quantity);
    if (!selectedBuildId || !selectedComponentId || !Number.isInteger(count) || count < 1) {
      setError("Выберите сборку, комплектующее и укажите количество не меньше 1");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await setBuildComponent(selectedBuildId, selectedComponentId, count);
      await load();
      setSelectedComponentId("");
      setQuantity("1");
      await checkCompatibility();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить состав сборки");
    } finally {
      setSaving(false);
    }
  }

  async function removeComponent(componentId: string, label: string) {
    if (!selectedBuildId || !window.confirm(`Убрать ${label} из сборки?`)) return;

    setSaving(true);
    setError("");
    try {
      await removeBuildComponent(selectedBuildId, componentId);
      await load();
      await checkCompatibility();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить комплектующее");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl font-semibold">Состав сборок</h1>
        <p className="mt-2 text-sm text-muted">
          Выберите готовую сборку и соберите её из компонентов базы. Несовместимые компоненты не будут добавлены.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-muted">Загрузка…</p>
      ) : builds.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Готовые сборки не найдены.</p>
      ) : (
        <>
          <section className="mt-8 rounded-md border border-border p-5">
            <label className="block">
              <span className="text-sm font-medium">Готовая сборка</span>
              <select
                value={selectedBuildId}
                onChange={(e) => setSelectedBuildId(e.target.value)}
                className="admin-input mt-2"
              >
                {builds.map((build) => (
                  <option key={build.id} value={build.id}>
                    {build.name} · {formatPrice(build.price)}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {selectedBuild && (
            <section className="mt-6 rounded-md border border-border p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-semibold">{selectedBuild.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {selectedBuild.category?.name ?? "Без категории"} · {selectedBuild.components.length} позиций
                  </p>
                </div>
                <span className="font-mono text-sm">{formatPrice(selectedBuild.price)}</span>
              </div>

              <div className="mt-6 rounded-md border border-border bg-black/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Проверка совместимости</p>
                    {compatibility ? (
                      <p className={`mt-1 text-sm ${compatibility.compatible ? "text-green-400" : "text-red-400"}`}>
                        {compatibility.compatible ? "Сборка совместима" : `Найдено проблем: ${compatibility.issues.length}`}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted">Проверка ещё не выполнена</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={checkCompatibility}
                    disabled={checking}
                    className="rounded-md border border-border px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {checking ? "Проверяем…" : "Проверить ещё раз"}
                  </button>
                </div>
                {compatibility && !compatibility.compatible && (
                  <ul className="mt-4 space-y-2 text-sm text-red-300">
                    {compatibility.issues.map((issue, index) => (
                      <li key={`${issue.type}-${index}`}>• {issue.message}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-[1fr_120px_auto]">
                <label>
                  <span className="text-sm font-medium">Комплектующее</span>
                  <input value={componentSearch} onChange={(e) => setComponentSearch(e.target.value)} placeholder="Поиск по производителю или модели…" className="admin-input mt-2" />
                  <select
                    value={selectedComponentId}
                    onChange={(e) => setSelectedComponentId(e.target.value)}
                    className="admin-input mt-2"
                  >
                    <option value="">{componentsLoading ? "Загрузка…" : `Выберите компонент · показано ${components.length} из ${componentsTotal}`}</option>
                    {components.map((component) => (
                      <option key={component.id} value={component.id}>
                        {component.category.name} · {component.manufacturer} {component.model}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs text-muted">Каталог загружается страницами по 50, а не целиком.</span>
                </label>
                <label>
                  <span className="text-sm font-medium">Количество</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="admin-input mt-2"
                  />
                </label>
                <button
                  type="button"
                  onClick={addComponent}
                  disabled={saving}
                  className="self-end rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Добавить / обновить
                </button>
              </div>

              <div className="mt-8 overflow-x-auto rounded-md border border-border">
                {selectedBuild.components.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-muted">В сборке пока нет комплектующих.</p>
                ) : (
                  <table className="w-full font-sans text-sm">
                    <thead>
                      <tr className="border-b border-border text-left font-mono text-xs text-muted">
                        <th className="px-4 py-3">Категория</th>
                        <th className="px-4 py-3">Комплектующее</th>
                        <th className="px-4 py-3">Количество</th>
                        <th className="px-4 py-3">Цена</th>
                        <th className="px-4 py-3 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBuild.components.map((item) => (
                        <tr key={item.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 text-muted">{item.component.category.name}</td>
                          <td className="px-4 py-3 font-medium">
                            {item.component.manufacturer} {item.component.model}
                          </td>
                          <td className="px-4 py-3 font-mono">{item.quantity}</td>
                          <td className="px-4 py-3 font-mono">{formatPrice(item.component.price)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeComponent(item.component.id, `${item.component.manufacturer} ${item.component.model}`)}
                              disabled={saving}
                              className="text-red-400 hover:underline disabled:opacity-50"
                            >
                              Убрать
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setComponentsLoading(true);
      try {
        const result = await getComponents({ search: componentSearch.trim() || undefined, stock: "in", sort: "name-asc", offset: 0, limit: 50 });
        setComponents(result.items);
        setComponentsTotal(result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось загрузить комплектующие");
      } finally {
        setComponentsLoading(false);
      }
    }, componentSearch.trim() ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [componentSearch]);

