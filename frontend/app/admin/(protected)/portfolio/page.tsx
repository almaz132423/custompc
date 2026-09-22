"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createPortfolio,
  deletePortfolio,
  getAdminPortfolio,
  updatePortfolio,
  type PortfolioInput,
  type PortfolioItem,
} from "@/lib/api";

const emptyForm: PortfolioInput = {
  slug: "",
  title: "",
  clientTask: "",
  budget: "",
  components: "",
  description: "",
  result: "",
  testing: "",
  isPublished: true,
  imageUrls: [],
};

export default function AdminPortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [form, setForm] = useState<PortfolioInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try { setItems(await getAdminPortfolio()); }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось загрузить портфолио"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function startEdit(item: PortfolioItem) {
    setEditingId(item.id);
    setForm({
      slug: item.slug,
      title: item.title,
      clientTask: item.clientTask ?? "",
      budget: item.budget ?? "",
      components: item.components ? JSON.stringify(item.components, null, 2) : "",
      description: item.description ?? "",
      result: item.result ?? "",
      testing: item.testing ?? "",
      isPublished: item.isPublished,
      imageUrls: item.images.map((image) => image.url),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, imageUrls: [] });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (!form.slug.trim()) throw new Error("Укажите slug");
      if (!form.title.trim()) throw new Error("Укажите название работы");
      if (form.components?.trim()) {
        try { JSON.parse(form.components); }
        catch { throw new Error("Поле «Комплектующие» должно содержать корректный JSON"); }
      }
      const input = {
        ...form,
        slug: form.slug.trim().toLowerCase(),
        title: form.title.trim(),
        imageUrls: form.imageUrls?.map((url) => url.trim()).filter(Boolean) ?? [],
      };
      if (editingId) await updatePortfolio(editingId, input);
      else await createPortfolio(input);
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить работу");
    } finally { setSaving(false); }
  }

  async function handleDelete(item: PortfolioItem) {
    if (!window.confirm(`Удалить работу «${item.title}»?`)) return;
    setError("");
    try {
      await deletePortfolio(item.id);
      if (editingId === item.id) resetForm();
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Не удалось удалить работу"); }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Портфолио</h1>
      <p className="mt-2 text-sm text-muted">Публикуйте реальные работы: задача клиента, бюджет, состав ПК, результат, тестирование и фотографии.</p>

      {error && <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-8 rounded-md border border-border p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold">{editingId ? "Редактирование работы" : "Новая работа"}</h2>
          {editingId && <button type="button" onClick={resetForm} className="text-sm text-muted hover:text-text">Отмена</button>}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Slug">
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="gaming-pc-1440p" className="admin-input" />
          </Field>
          <Field label="Название">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="admin-input" />
          </Field>
          <Field label="Бюджет, ₽">
            <input type="number" min="0" step="0.01" value={form.budget ?? ""} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="admin-input" />
          </Field>
          <label className="flex items-center gap-3 pt-7 text-sm">
            <input type="checkbox" checked={form.isPublished !== false} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
            Показывать на сайте
          </label>
          <Field label="Задача клиента">
            <textarea rows={4} value={form.clientTask ?? ""} onChange={(e) => setForm({ ...form, clientTask: e.target.value })} className="admin-input" />
          </Field>
          <Field label="Результат">
            <textarea rows={4} value={form.result ?? ""} onChange={(e) => setForm({ ...form, result: e.target.value })} className="admin-input" />
          </Field>
          <Field label="Описание">
            <textarea rows={4} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" />
          </Field>
          <Field label="Тестирование">
            <textarea rows={4} value={form.testing ?? ""} onChange={(e) => setForm({ ...form, testing: e.target.value })} className="admin-input" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Комплектующие (JSON)">
              <textarea rows={7} value={form.components ?? ""} onChange={(e) => setForm({ ...form, components: e.target.value })} placeholder='{"CPU":"Ryzen 7 ...","GPU":"RTX ..."}' className="admin-input font-mono text-xs" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="URL фотографий — по одному на строку">
              <textarea rows={5} value={(form.imageUrls ?? []).join("\n")} onChange={(e) => setForm({ ...form, imageUrls: e.target.value.split("\n") })} placeholder="https://..." className="admin-input" />
            </Field>
          </div>
        </div>

        <button disabled={saving} className="mt-5 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
          {saving ? "Сохраняем…" : editingId ? "Сохранить изменения" : "Добавить работу"}
        </button>
      </form>

      <section className="mt-8 rounded-md border border-border">
        <div className="border-b border-border px-5 py-4"><h2 className="font-display text-lg font-semibold">Работы</h2></div>
        {loading ? <p className="px-5 py-6 text-sm text-muted">Загрузка…</p> : items.length === 0 ? <p className="px-5 py-6 text-sm text-muted">Работ пока нет.</p> : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <article key={item.id} className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{item.title}</h3>
                    <span className="font-mono text-xs text-muted">/{item.slug}</span>
                    {!item.isPublished && <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">Скрыта</span>}
                  </div>
                  {item.clientTask && <p className="mt-2 max-w-2xl text-sm text-muted">{item.clientTask}</p>}
                  <p className="mt-2 font-mono text-xs text-muted">{item.budget ? `${Number(item.budget).toLocaleString("ru-RU")} ₽` : "Бюджет не указан"} · {item.images.length} фото</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => startEdit(item)} className="rounded-md border border-border px-3 py-2 text-sm">Изменить</button>
                  <button type="button" onClick={() => handleDelete(item)} className="rounded-md border border-red-500/40 px-3 py-2 text-sm text-red-400">Удалить</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-medium">{label}</span><div className="mt-2">{children}</div></label>;
}
