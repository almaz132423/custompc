"use client";

import { useEffect, useState } from "react";
import {
  addPcBuildImage,
  createPcBuild,
  deletePcBuild,
  deletePcBuildImage,
  formatPrice,
  getAdminPcBuilds,
  getPcBuildCategories,
  purposeLabel,
  resolutionLabel,
  updatePcBuild,
  type AdminPcBuild,
  type PcBuildCategory,
  type PcBuildInput,
} from "@/lib/api";

const initialForm: PcBuildInput = { slug: "", name: "", description: "", price: "", status: "AVAILABLE", purpose: "GAMES", resolution: "R1080P", warrantyMonths: 12, buildTimeDays: 3, avitoUrl: "", categoryId: "" };

export default function AdminPcBuildsPage() {
  const [builds, setBuilds] = useState<AdminPcBuild[]>([]);
  const [categories, setCategories] = useState<PcBuildCategory[]>([]);
  const [form, setForm] = useState<PcBuildInput>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { const [b, c] = await Promise.all([getAdminPcBuilds(), getPcBuildCategories()]); setBuilds(b); setCategories(c); }
    catch (e) { setError(e instanceof Error ? e.message : "Ошибка загрузки"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function edit(build: AdminPcBuild) {
    setEditingId(build.id);
    setForm({ slug: build.slug, name: build.name, description: build.description ?? "", price: build.price, status: build.status ?? "AVAILABLE", purpose: build.purpose, resolution: build.resolution ?? "", warrantyMonths: build.warrantyMonths ?? 0, buildTimeDays: build.buildTimeDays ?? 0, avitoUrl: build.avitoUrl ?? "", categoryId: build.category?.id ?? "" });
    setImageUrl(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function reset() { setEditingId(null); setForm(initialForm); setImageUrl(""); }
  function setField<K extends keyof PcBuildInput>(key: K, value: PcBuildInput[K]) { setForm((f) => ({ ...f, [key]: value })); }

  async function save() {
    if (!form.slug.trim() || !form.name.trim() || !form.price || !form.purpose) { setError("Заполните slug, название, цену и назначение"); return; }
    setSaving(true); setError("");
    try { if (editingId) await updatePcBuild(editingId, form); else await createPcBuild(form); await load(); reset(); }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось сохранить сборку"); }
    finally { setSaving(false); }
  }

  async function remove(build: AdminPcBuild) {
    if (!window.confirm(`Удалить сборку «${build.name}»? Если на неё есть заявки или заказы, удаление будет запрещено.`)) return;
    setSaving(true); setError("");
    try { await deletePcBuild(build.id); await load(); if (editingId === build.id) reset(); }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось удалить сборку"); }
    finally { setSaving(false); }
  }

  async function addImage() {
    if (!editingId || !imageUrl.trim()) return;
    setSaving(true); setError("");
    try { await addPcBuildImage(editingId, imageUrl.trim(), (builds.find(b => b.id === editingId)?.images.length ?? 0)); setImageUrl(""); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось добавить изображение"); }
    finally { setSaving(false); }
  }

  async function removeImage(imageId: string) {
    if (!editingId) return;
    setSaving(true); setError("");
    try { await deletePcBuildImage(editingId, imageId); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось удалить изображение"); }
    finally { setSaving(false); }
  }

  return <div>
    <div><h1 className="font-display text-2xl font-semibold">Готовые сборки</h1><p className="mt-2 text-sm text-muted">Создание и редактирование карточек ПК, статуса, цены, назначения и изображений.</p></div>
    {error && <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">{error}</div>}

    <section className="mt-8 rounded-md border border-border p-5">
      <div className="flex items-center justify-between gap-4"><h2 className="font-display text-lg font-semibold">{editingId ? "Редактирование сборки" : "Новая сборка"}</h2>{editingId && <button onClick={reset} className="text-sm text-muted hover:text-text">Отмена</button>}</div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label><span className="text-sm font-medium">Название</span><input className="admin-input mt-2" value={form.name} onChange={e => setField("name", e.target.value)} /></label>
        <label><span className="text-sm font-medium">Slug</span><input className="admin-input mt-2" value={form.slug} onChange={e => setField("slug", e.target.value)} /></label>
        <label><span className="text-sm font-medium">Цена</span><input className="admin-input mt-2" type="number" min="0" value={form.price} onChange={e => setField("price", e.target.value)} /></label>
        <label><span className="text-sm font-medium">Категория</span><select className="admin-input mt-2" value={form.categoryId} onChange={e => setField("categoryId", e.target.value)}><option value="">Без категории</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label><span className="text-sm font-medium">Назначение</span><select className="admin-input mt-2" value={form.purpose} onChange={e => setField("purpose", e.target.value)}>{["GAMES","WORK","MONTAGE","THREE_D","STREAMING","AI","UNIVERSAL"].map(v => <option key={v} value={v}>{purposeLabel(v)}</option>)}</select></label>
        <label><span className="text-sm font-medium">Разрешение</span><select className="admin-input mt-2" value={form.resolution} onChange={e => setField("resolution", e.target.value)}><option value="">Не указано</option>{["R1080P","R1440P","R4K"].map(v => <option key={v} value={v}>{resolutionLabel(v)}</option>)}</select></label>
        <label><span className="text-sm font-medium">Статус</span><select className="admin-input mt-2" value={form.status} onChange={e => setField("status", e.target.value as PcBuildInput["status"])}><option value="AVAILABLE">Доступна</option><option value="HIDDEN">Скрыта</option><option value="SOLD">Продана</option></select></label>
        <label><span className="text-sm font-medium">Гарантия, мес.</span><input className="admin-input mt-2" type="number" min="0" value={form.warrantyMonths ?? ""} onChange={e => setField("warrantyMonths", Number(e.target.value))} /></label>
        <label><span className="text-sm font-medium">Срок сборки, дней</span><input className="admin-input mt-2" type="number" min="0" value={form.buildTimeDays ?? ""} onChange={e => setField("buildTimeDays", Number(e.target.value))} /></label>
        <label><span className="text-sm font-medium">Авито URL</span><input className="admin-input mt-2" type="url" value={form.avitoUrl} onChange={e => setField("avitoUrl", e.target.value)} /></label>
      </div>
      <label className="mt-4 block"><span className="text-sm font-medium">Описание</span><textarea className="admin-input mt-2 min-h-28" value={form.description} onChange={e => setField("description", e.target.value)} /></label>
      <button onClick={save} disabled={saving} className="mt-5 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{editingId ? "Сохранить изменения" : "Создать сборку"}</button>
    </section>

    {editingId && <section className="mt-6 rounded-md border border-border p-5"><h2 className="font-display text-lg font-semibold">Изображения</h2><div className="mt-4 flex gap-3"><input className="admin-input" placeholder="https://..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} /><button onClick={addImage} disabled={saving || !imageUrl.trim()} className="rounded-md border border-border px-4 py-2 text-sm disabled:opacity-50">Добавить</button></div><div className="mt-4 space-y-2">{builds.find(b => b.id === editingId)?.images.map(img => <div key={img.id} className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2 text-sm"><span className="truncate">{img.url}</span><button onClick={() => removeImage(img.id)} disabled={saving} className="text-red-400 hover:underline">Удалить</button></div>)}</div></section>}

    <section className="mt-8 overflow-x-auto rounded-md border border-border">{loading ? <p className="px-4 py-5 text-sm text-muted">Загрузка…</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border text-left font-mono text-xs text-muted"><th className="px-4 py-3">Сборка</th><th className="px-4 py-3">Цена</th><th className="px-4 py-3">Назначение</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3 text-right">Действия</th></tr></thead><tbody>{builds.map(b => <tr key={b.id} className="border-b border-border last:border-0"><td className="px-4 py-3"><div className="font-medium">{b.name}</div><div className="text-xs text-muted">/{b.slug}</div></td><td className="px-4 py-3 font-mono">{formatPrice(b.price)}</td><td className="px-4 py-3">{purposeLabel(b.purpose)}</td><td className="px-4 py-3">{b.status === "AVAILABLE" ? "Доступна" : b.status === "SOLD" ? "Продана" : "Скрыта"}</td><td className="px-4 py-3 text-right"><button onClick={() => edit(b)} className="mr-4 hover:underline">Изменить</button><button onClick={() => remove(b)} disabled={saving} className="text-red-400 hover:underline">Удалить</button></td></tr>)}</tbody></table>}</section>
  </div>;
}
