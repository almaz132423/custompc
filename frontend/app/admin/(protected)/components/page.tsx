"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
type CompatibilityField = { key: string; label: string; placeholder: string; type?: "text" | "number"; help?: string };
type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc" | "stock";

const compatibilityFields: Record<string, CompatibilityField[]> = {
  CPU: [{ key: "socket", label: "Сокет", placeholder: "AM5", help: "Должен совпадать с сокетом материнской платы и кулера." }],
  MOTHERBOARD: [
    { key: "socket", label: "Сокет CPU", placeholder: "AM5", help: "С каким сокетом процессора совместима плата." },
    { key: "ramType", label: "Тип памяти", placeholder: "DDR5", help: "Например DDR4 или DDR5." },
    { key: "formFactor", label: "Форм-фактор", placeholder: "ATX", help: "Например ATX, mATX, Mini-ITX." },
  ],
  RAM: [{ key: "ramType", label: "Тип памяти", placeholder: "DDR5", help: "Должен совпадать с поддерживаемым типом RAM у платы." }],
  COOLING: [
    { key: "socket", label: "Поддерживаемый сокет", placeholder: "AM5", help: "Сокет процессора, для которого подходит охлаждение." },
    { key: "heightMm", label: "Высота, мм", placeholder: "157", type: "number", help: "Нужна для проверки ограничения корпуса." },
  ],
  GPU: [
    { key: "lengthMm", label: "Длина видеокарты, мм", placeholder: "300", type: "number", help: "Нужна для проверки длины внутри корпуса." },
    { key: "powerW", label: "Потребление, Вт", placeholder: "220", type: "number", help: "Используется для проверки требований к БП." },
  ],
  CASE: [
    { key: "formFactor", label: "Поддерживаемый форм-фактор платы", placeholder: "ATX", help: "Например ATX, mATX, Mini-ITX." },
    { key: "gpuLengthMm", label: "Макс. длина GPU, мм", placeholder: "365", type: "number" },
    { key: "coolerHeightMm", label: "Макс. высота кулера, мм", placeholder: "165", type: "number" },
  ],
  PSU: [{ key: "wattage", label: "Мощность, Вт", placeholder: "750", type: "number", help: "Доступная мощность блока питания." }],
  SSD: [
    { key: "interface", label: "Интерфейс", placeholder: "NVMe", help: "Например NVMe или SATA." },
    { key: "formFactor", label: "Форм-фактор", placeholder: "M.2", help: "Например M.2 или 2.5-inch." },
  ],
  HDD: [
    { key: "interface", label: "Интерфейс", placeholder: "SATA", help: "Например SATA." },
    { key: "formFactor", label: "Форм-фактор", placeholder: "3.5-inch" },
  ],
};

const categoryExplanations: Record<string, string> = {
  CPU: "Для процессора главное — сокет. Например AM5 должен находить AM5 на материнской плате.",
  MOTHERBOARD: "Плата связывает CPU и RAM: укажите сокет процессора, тип памяти и форм-фактор.",
  RAM: "Тип памяти должен совпадать с поддерживаемым типом материнской платы.",
  GPU: "Длина и потребление помогают проверить корпус и требования к блоку питания.",
  PSU: "Укажите мощность БП — это основа проверки запаса по питанию.",
  CASE: "Корпус задаёт физические ограничения: формат платы, длину GPU и высоту кулера.",
  COOLING: "Укажите поддерживаемый сокет и при необходимости высоту кулера.",
  SSD: "Для накопителя обычно важны интерфейс и форм-фактор.",
  HDD: "Для HDD обычно важны интерфейс и форм-фактор.",
};

export default function AdminComponentsPage() {
  const [categories, setCategories] = useState<ComponentCategory[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "out">("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortOption>("name-asc");
  const [form, setForm] = useState<ComponentForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedCategory = useMemo(() => categories.find((category) => category.id === form.categoryId), [categories, form.categoryId]);
  const fields = compatibilityFields[selectedCategory?.code ?? ""] ?? [];

  const filteredComponents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru-RU");
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);
    const result = components.filter((component) => {
      const name = `${component.manufacturer} ${component.model}`.toLocaleLowerCase("ru-RU");
      const category = component.category.name.toLocaleLowerCase("ru-RU");
      const haystack = `${name} ${category} ${toJsonText(component.specs)} ${toJsonText(component.compatibility)}`.toLocaleLowerCase("ru-RU");
      const price = Number(component.price);
      return (!categoryFilter || component.categoryId === categoryFilter)
        && (!query || haystack.includes(query))
        && (stockFilter === "all" || (stockFilter === "in" ? component.inStock : !component.inStock))
        && (min === null || (!Number.isNaN(min) && price >= min))
        && (max === null || (!Number.isNaN(max) && price <= max));
    });

    return result.sort((a, b) => {
      if (sort === "price-asc") return Number(a.price) - Number(b.price);
      if (sort === "price-desc") return Number(b.price) - Number(a.price);
      if (sort === "stock") return Number(b.inStock) - Number(a.inStock);
      const aName = `${a.manufacturer} ${a.model}`;
      const bName = `${b.manufacturer} ${b.model}`;
      return sort === "name-desc" ? bName.localeCompare(aName, "ru") : aName.localeCompare(bName, "ru");
    });
  }, [components, categoryFilter, search, stockFilter, minPrice, maxPrice, sort]);

  async function loadComponents() {
    setLoading(true);
    setError("");
    try {
      setComponents(await getComponents());
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
        if (loadedCategories[0]) setForm((current) => ({ ...current, categoryId: current.categoryId || loadedCategories[0].id }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  function startEdit(component: Component) {
    setEditingId(component.id);
    setForm({ categoryId: component.categoryId, manufacturer: component.manufacturer, model: component.model, price: component.price, imageUrl: component.imageUrl ?? "", specs: toJsonText(component.specs), compatibility: toJsonText(component.compatibility), inStock: component.inStock });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
  }

  function resetFilters() {
    setSearch("");
    setCategoryFilter("");
    setStockFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setSort("name-asc");
  }

  function updateCompatibilityField(key: string, value: string) {
    let current: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(form.compatibility || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) current = parsed;
    } catch {}
    if (!value.trim()) delete current[key];
    else current[key] = /^\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : value.trim();
    setForm({ ...form, compatibility: JSON.stringify(current, null, 2) });
  }

  function getCompatibilityValue(key: string): string {
    try {
      const parsed = JSON.parse(form.compatibility || "{}");
      const value = parsed?.[key];
      return value == null ? "" : String(value);
    } catch {
      return "";
    }
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
      if (!input.categoryId || !input.manufacturer || !input.model || !input.price) throw new Error("Заполните категорию, производителя, модель и цену");
      if (editingId) await updateComponent(editingId, input);
      else await createComponent(input);
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
          <p className="mt-2 text-sm text-muted">База компонентов для готовых сборок и конфигуратора.</p>
        </div>
        <span className="font-mono text-xs text-muted">Показано {filteredComponents.length} из {components.length}</span>
      </div>

      {error && <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-8 rounded-md border border-border p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold">{editingId ? "Редактирование" : "Новое комплектующее"}</h2>
          {editingId && <button type="button" onClick={resetForm} className="text-sm text-muted hover:text-text">Отмена</button>}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Категория"><select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="admin-input"><option value="">Выберите категорию</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
          <Field label="Производитель"><input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="admin-input" /></Field>
          <Field label="Модель"><input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="admin-input" /></Field>
          <Field label="Цена, ₽"><input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="admin-input" /></Field>
          <Field label="Изображение URL"><input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="admin-input" /></Field>
          <label className="flex items-center gap-3 pt-7 text-sm"><input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} />В наличии</label>
          <Field label="Характеристики JSON" hint='Для обычных характеристик: например {"cores":6,"frequencyGHz":4.2}'><textarea value={form.specs} onChange={(e) => setForm({ ...form, specs: e.target.value })} rows={5} className="admin-input font-mono text-xs" /></Field>

          <div className="rounded-md border border-border p-4">
            <div><h3 className="text-sm font-medium">Совместимость</h3><p className="mt-1 text-xs text-muted">Основные параметры заполняются обычными полями. JSON формируется автоматически.</p></div>
            {selectedCategory?.code && categoryExplanations[selectedCategory.code] && <div className="mt-3 rounded-md bg-black/20 px-3 py-2 text-xs text-muted">{categoryExplanations[selectedCategory.code]}</div>}
            {fields.length > 0 ? <div className="mt-4 grid gap-3">{fields.map((field) => <Field key={field.key} label={field.label} hint={field.help}><input type={field.type ?? "text"} value={getCompatibilityValue(field.key)} onChange={(e) => updateCompatibilityField(field.key, e.target.value)} placeholder={field.placeholder} min={field.type === "number" ? "0" : undefined} className="admin-input" /></Field>)}</div> : <p className="mt-4 text-xs text-muted">Для этой категории нет преднастроенных полей. Используйте расширенный JSON ниже.</p>}
            <details className="mt-4"><summary className="cursor-pointer text-xs font-medium text-accent">Расширенный JSON</summary><textarea value={form.compatibility} onChange={(e) => setForm({ ...form, compatibility: e.target.value })} rows={6} className="admin-input mt-2 font-mono text-xs" placeholder={'{\n  "socket": "AM5"\n}'} /><p className="mt-1 text-xs text-muted">Используйте этот режим для параметров, которых нет в быстрых полях.</p></details>
          </div>
        </div>
        <button disabled={saving} className="mt-5 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? "Сохраняем…" : editingId ? "Сохранить изменения" : "Добавить комплектующее"}</button>
      </form>

      <section className="mt-8 rounded-md border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-display text-lg font-semibold">Каталог</h2><p className="mt-1 text-xs text-muted">Поиск работает по названию, категории, характеристикам и совместимости.</p></div>
          <button type="button" onClick={resetFilters} className="text-xs text-muted hover:text-text">Сбросить фильтры</button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Поиск"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="RTX 4060, Ryzen, AM5…" className="admin-input" /></Field>
          <Field label="Категория"><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="admin-input"><option value="">Все категории</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
          <Field label="Наличие"><select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as "all" | "in" | "out")} className="admin-input"><option value="all">Все</option><option value="in">Только в наличии</option><option value="out">Нет в наличии</option></select></Field>
          <Field label="Сортировка"><select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="admin-input"><option value="name-asc">Название: А → Я</option><option value="name-desc">Название: Я → А</option><option value="price-asc">Цена: сначала дешевле</option><option value="price-desc">Цена: сначала дороже</option><option value="stock">Сначала в наличии</option></select></Field>
          <Field label="Цена от, ₽"><input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="admin-input" /></Field>
          <Field label="Цена до, ₽"><input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="admin-input" /></Field>
        </div>
      </section>

      {loading ? <p className="mt-6 text-sm text-muted">Загрузка…</p> : filteredComponents.length === 0 ? <p className="mt-6 text-sm text-muted">По заданным фильтрам комплектующие не найдены.</p> : (
        <div className="mt-4 overflow-x-auto rounded-md border border-border">
          <table className="w-full font-sans text-sm">
            <thead><tr className="border-b border-border text-left font-mono text-xs text-muted"><th className="px-4 py-3">Фото</th><th className="px-4 py-3">Категория</th><th className="px-4 py-3">Комплектующее</th><th className="px-4 py-3">Цена</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Данные</th><th className="px-4 py-3 text-right">Действия</th></tr></thead>
            <tbody>{filteredComponents.map((component) => <tr key={component.id} className="border-b border-border last:border-0 align-top">
              <td className="px-4 py-3">{component.imageUrl ? <img src={component.imageUrl} alt="" className="h-12 w-12 rounded object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded border border-border text-[10px] text-muted">Нет фото</div>}</td>
              <td className="px-4 py-3 text-muted">{component.category.name}</td>
              <td className="px-4 py-3 font-medium">{component.manufacturer} {component.model}</td>
              <td className="px-4 py-3 whitespace-nowrap font-mono">{formatPrice(component.price)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{component.inStock ? "В наличии" : "Нет в наличии"}</td>
              <td className="px-4 py-3 min-w-56">{(component.specs != null || component.compatibility != null) && <details><summary className="cursor-pointer text-xs text-accent">Показать характеристики</summary><div className="mt-2 space-y-2 text-xs"><DataBlock label="Характеристики" value={component.specs} /><DataBlock label="Совместимость" value={component.compatibility} /></div></details>}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap"><button onClick={() => startEdit(component)} className="mr-3 text-accent hover:underline">Изменить</button><button onClick={() => handleDelete(component)} className="text-red-400 hover:underline">Удалить</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-medium">{label}</span>{hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}<div className="mt-2">{children}</div></label>;
}

function DataBlock({ label, value }: { label: string; value: unknown }) {
  if (value == null) return null;
  return <div><div className="font-medium text-muted">{label}</div><pre className="mt-1 max-h-32 overflow-auto rounded border border-border bg-black/10 p-2 font-mono text-[11px] whitespace-pre-wrap">{toJsonText(value)}</pre></div>;
}

function parseJson(value: string, label: string): unknown {
  if (!value.trim()) return undefined;
  try { return JSON.parse(value); } catch { throw new Error(`${label}: некорректный JSON`); }
}

function toJsonText(value: unknown): string {
  if (value == null) return "";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}
