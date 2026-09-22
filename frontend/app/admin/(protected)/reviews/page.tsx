"use client";

import { FormEvent, useEffect, useState } from "react";
import { createReview, deleteReview, getAdminReviews, updateReview, type Review, type ReviewInput } from "@/lib/api";

const empty: ReviewInput = { customerName: "", text: "", rating: 5, photoUrl: "", purchasedBuild: "", isPublished: false };

export default function AdminReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [form, setForm] = useState<ReviewInput>({ ...empty });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() { setLoading(true); setError(""); try { setItems(await getAdminReviews()); } catch (e) { setError(e instanceof Error ? e.message : "Не удалось загрузить отзывы"); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);

  function edit(item: Review) {
    setEditingId(item.id);
    setForm({ customerName: item.customerName, text: item.text, rating: item.rating, photoUrl: item.photoUrl ?? "", purchasedBuild: item.purchasedBuild ?? "", isPublished: item.isPublished });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function reset() { setEditingId(null); setForm({ ...empty }); }

  async function submit(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (!form.customerName.trim() || !form.text.trim()) throw new Error("Укажите имя клиента и текст отзыва");
      if (form.rating < 1 || form.rating > 5) throw new Error("Оценка должна быть от 1 до 5");
      const input = { ...form, customerName: form.customerName.trim(), text: form.text.trim(), photoUrl: form.photoUrl?.trim() || undefined, purchasedBuild: form.purchasedBuild?.trim() || undefined };
      if (editingId) await updateReview(editingId, input); else await createReview(input);
      reset(); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Не удалось сохранить отзыв"); }
    finally { setSaving(false); }
  }

  async function remove(item: Review) {
    if (!window.confirm(`Удалить отзыв «${item.customerName}»?`)) return;
    try { await deleteReview(item.id); if (editingId === item.id) reset(); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось удалить отзыв"); }
  }

  return <div>
    <h1 className="font-display text-2xl font-semibold">Отзывы</h1>
    <p className="mt-2 text-sm text-muted">Добавляйте отзывы клиентов и управляйте их публикацией на сайте.</p>
    {error && <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">{error}</div>}

    <form onSubmit={submit} className="mt-8 rounded-md border border-border p-5">
      <div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">{editingId ? "Редактирование" : "Новый отзыв"}</h2>{editingId && <button type="button" onClick={reset} className="text-sm text-muted">Отмена</button>}</div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Имя клиента"><input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="admin-input" /></Field>
        <Field label="Оценка"><select value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} className="admin-input">{[1,2,3,4,5].map(n => <option key={n} value={n}>{n} / 5</option>)}</select></Field>
        <Field label="Сборка / услуга"><input value={form.purchasedBuild ?? ""} onChange={e => setForm({ ...form, purchasedBuild: e.target.value })} className="admin-input" /></Field>
        <Field label="Фото URL"><input value={form.photoUrl ?? ""} onChange={e => setForm({ ...form, photoUrl: e.target.value })} className="admin-input" /></Field>
        <div className="md:col-span-2"><Field label="Текст"><textarea rows={5} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} className="admin-input" /></Field></div>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.isPublished === true} onChange={e => setForm({ ...form, isPublished: e.target.checked })} />Опубликовать</label>
      </div>
      <button disabled={saving} className="mt-5 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? "Сохраняем…" : editingId ? "Сохранить изменения" : "Добавить отзыв"}</button>
    </form>

    <section className="mt-8 rounded-md border border-border">
      <div className="border-b border-border px-5 py-4"><h2 className="font-display text-lg font-semibold">Все отзывы</h2></div>
      {loading ? <p className="px-5 py-6 text-sm text-muted">Загрузка…</p> : items.length === 0 ? <p className="px-5 py-6 text-sm text-muted">Отзывов пока нет.</p> :
        <div className="divide-y divide-border">{items.map(item => <article key={item.id} className="flex flex-col gap-4 px-5 py-5 md:flex-row md:justify-between">
          <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{item.customerName}</h3><span className="font-mono text-xs">{"★".repeat(item.rating)}{"☆".repeat(5-item.rating)}</span>{!item.isPublished && <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">Скрыт</span>}</div><p className="mt-2 max-w-2xl text-sm text-muted">{item.text}</p>{item.purchasedBuild && <p className="mt-2 text-xs text-muted">{item.purchasedBuild}</p>}</div>
          <div className="flex shrink-0 gap-2"><button type="button" onClick={() => edit(item)} className="rounded-md border border-border px-3 py-2 text-sm">Изменить</button><button type="button" onClick={() => remove(item)} className="rounded-md border border-red-500/40 px-3 py-2 text-sm text-red-400">Удалить</button></div>
        </article>)}</div>}
    </section>
  </div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="text-sm font-medium">{label}</span><div className="mt-2">{children}</div></label>; }
