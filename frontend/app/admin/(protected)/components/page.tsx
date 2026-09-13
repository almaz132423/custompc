"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createComponent,
  deleteComponent,
  formatPrice,
  getComponentCategories,
  getComponents,
  updateComponent,
  type Component,
  type ComponentCategory,
} from "@/lib/api";

const emptyForm = {
  categoryId: "",
  manufacturer: "",
  model: "",
  price: "",
  imageUrl: "",
  specs: "",
  compatibility: "",
  inStock: true,
};

type ComponentForm = typeof emptyForm;

export default function AdminComponentsPage() {
  const [categories, setCategories] = useState<ComponentCategory[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [form, setForm] = useState<ComponentForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadComponents(filter = categoryFilter) {
    setLoading(true);
    setError("");
    try {
      setComponents(await getComponents(filter || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([getComponentCategories(), getComponents()])
      .then(([loadedCategories, loadedComponents]) => {
        setCategories(loadedCategories);
        setComponents(loadedComponents);
        if (loadedCategories[0]) {
          setForm((current) => ({ ...current, categoryId: current.categoryId || loadedCategories[0].id }));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  function startEdit(component: Component) {
    setEditingId(component.id);
    setForm({
      categoryId: component.categoryId,
      manufacturer: component.manufacturer,
      model: component.model,
      price: component.price,
      imageUrl: component.imageUrl ?? "",
      specs: toJsonText(component.specs),
      compatibility: toJsonText(component.compatibility),
      inStock: component.inStock,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const input = {
        categoryId: form.categoryId,
        manufacturer: form.manufacturer.trim(),
        model: form.model.trim(),
        price: form.price.trim(),
        imageUrl: form.imageUrl.trim() || null,
        specs: parseJson(form.specs, "Характеристики"),
        compatibility: parseJson(form.compatibility, "Совместимость"),
        inStock: form.inStock,
      };

      if (!input.categoryId || !input.manufacturer || !input.model || !input.price) {
        throw new Error("Заполните категорию, производителя, модель и цену");
      }

      if (editingId) {
        await updateComponent(editingId, input);
      } else {
        await createComponent(input);
      }

      resetForm();
      await loadComponents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить комплектующее");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(component: Component) {
    if (!window.confirm(`Удалить ${component.manufacturer} ${component.model}?`)) return;

    setError("");
    try {
      await deleteComponent(component.id);
      if (editingId === component.id) resetForm();
      await loadComponents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить комплектующее");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Комплектующие</h1>
          <p className="mt-2 text-sm text-muted">
            База компонентов для готовых сборок и будущего конфигуратора.
          </p>
        </div>
        <span className="font-mono text-xs text-muted">{components.length} шт.</span>
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 rounded-md border border-border p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold">
            {editingId ? "Редактирование" : "Новое комплектующее"}
          </h2>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-sm text-muted hover:text-text">
              Отмена
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Категория">
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="admin-input"
            >
              <option value="">Выберите категорию</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Производитель">
            <input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="admin-input" />
          </Field>
          <Field label="Модель">
            <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="admin-input" />
          </Field>
          <Field label="Цена, ₽">
            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="admin-input" />
          </Field>
          <Field label="Изображение URL">
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="admin-input" />
          </Field>
          <label className="flex items-center gap-3 pt-7 text-sm">
            <input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} />
            В наличии
          </label>
          <Field label="Характеристики JSON" hint='например: {"socket":"AM5","cores":6}'>
            <textarea value={form.specs} onChange={(e) => setForm({ ...form, specs: e.target.value })} rows={4} className="admin-input font-mono text-xs" />
          </Field>
          <Field label="Совместимость JSON" hint='например: {"socket":"AM5"}'>
            <textarea value={form.compatibility} onChange={(e) => setForm({ ...form, compatibility: e.target.value })} rows={4} className="admin-input font-mono text-xs" />
          </Field>
        </div>

        <button disabled={saving} className="mt-5 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
          {saving ? "Сохраняем…" : editingId ? "Сохранить изменения" : "Добавить комплектующее"}
        </button>
      </form>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-lg font-semibold">Список</h2>
        <select
          value={categoryFilter}
          onChange={(e) => {
            const value = e.target.value;
            setCategoryFilter(value);
            loadComponents(value);
          }}
          className="admin-input w-auto min-w-52"
        >
          <option value="">Все категории</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted">Загрузка…</p>
      ) : components.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Комплектующие не найдены.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border border-border">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-xs text-muted">
                <th className="px-4 py-3">Категория</th>
                <th className="px-4 py-3">Комплектующее</th>
                <th className="px-4 py-3">Цена</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {components.map((component) => (
                <tr key={component.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-muted">{component.category.name}</td>
                  <td className="px-4 py-3 font-medium">{component.manufacturer} {component.model}</td>
                  <td className="px-4 py-3 font-mono">{formatPrice(component.price)}</td>
                  <td className="px-4 py-3">{component.inStock ? "В наличии" : "Нет в наличии"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(component)} className="mr-3 text-accent hover:underline">Изменить</button>
                    <button onClick={() => handleDelete(component)} className="text-red-400 hover:underline">Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function parseJson(value: string, label: string): unknown {
  if (!value.trim()) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label}: некорректный JSON`);
  }
}

function toJsonText(value: unknown): string {
  if (value == null) return "";
  return JSON.stringify(value, null, 2);
}
