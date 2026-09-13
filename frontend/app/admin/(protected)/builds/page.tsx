"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatPrice,
  getAdminBuilds,
  getComponents,
  removeBuildComponent,
  setBuildComponent,
  type AdminBuild,
  type Component,
} from "@/lib/api";

export default function AdminBuildsPage() {
  const [builds, setBuilds] = useState<AdminBuild[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedBuildId, setSelectedBuildId] = useState("");
  const [selectedComponentId, setSelectedComponentId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(true);
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
      const [loadedBuilds, loadedComponents] = await Promise.all([
        getAdminBuilds(),
        getComponents(),
      ]);
      setBuilds(loadedBuilds);
      setComponents(loadedComponents);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить состав");
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
          Выберите готовую сборку и соберите её из компонентов базы.
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

              <div className="mt-6 grid gap-4 md:grid-cols-[1fr_120px_auto]">
                <label>
                  <span className="text-sm font-medium">Комплектующее</span>
                  <select
                    value={selectedComponentId}
                    onChange={(e) => setSelectedComponentId(e.target.value)}
                    className="admin-input mt-2"
                  >
                    <option value="">Выберите компонент</option>
                    {components.map((component) => (
                      <option key={component.id} value={component.id}>
                        {component.category.name} · {component.manufacturer} {component.model}
                      </option>
                    ))}
                  </select>
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
