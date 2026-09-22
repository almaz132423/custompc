"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createService,
  deleteService,
  getAdminServices,
  updateService,
  type Service,
  type ServiceInput,
  type ServiceType,
} from "@/lib/api";

const emptyForm: ServiceInput = {
  type: "BUILD",
  name: "",
  description: "",
  priceFrom: "",
  priceTo: "",
  durationDays: "",
  isActive: true,
};

const typeLabels: Record<ServiceType, string> = {
  BUILD: "Сборка",
  UPGRADE: "Апгрейд",
  REPAIR: "Ремонт",
  MAINTENANCE: "Обслуживание",
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<ServiceInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setServices(await getAdminServices());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить услуги");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startEdit(service: Service) {
    setEditingId(service.id);
    setForm({
      type: service.type,
      name: service.name,
      description: service.description ?? "",
      priceFrom: service.priceFrom ?? "",
      priceTo: service.priceTo ?? "",
      durationDays: service.durationDays?.toString() ?? "",
      isActive: service.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (!form.name.trim()) throw new Error("Укажите название услуги");
      const input = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || "",
        priceFrom: form.priceFrom?.trim() || undefined,
        priceTo: form.priceTo?.trim() || undefined,
        durationDays: form.durationDays?.trim() || undefined,
      };
      if (editingId) await updateService(editingId, input);
      else await createService(input);
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить услугу");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(service: Service) {
    if (!window.confirm(`Удалить услугу «${service.name}»?`)) return;
    setError("");
    try {
      await deleteService(service.id);
      if (editingId === service.id) resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить услугу");
    }
  }

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl font-semibold">Услуги</h1>
        <p className="mt-2 text-sm text-muted">Управление услугами, ценами и сроками, которые показываются на публичной странице.</p>
      </div>

      {error && <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-8 rounded-md border border-border p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold">{editingId ? "Редактирование услуги" : "Новая услуга"}</h2>
          {editingId && <button type="button" onClick={resetForm} className="text-sm text-muted hover:text-text">Отмена</button>}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Тип">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ServiceType })} className="admin-input">
              {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Название">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="admin-input" />
          </Field>
          <Field label="Цена от, ₽">
            <input type="number" min="0" step="0.01" value={form.priceFrom ?? ""} onChange={(e) => setForm({ ...form, priceFrom: e.target.value })} className="admin-input" />
          </Field>
          <Field label="Цена до, ₽">
            <input type="number" min="0" step="0.01" value={form.priceTo ?? ""} onChange={(e) => setForm({ ...form, priceTo: e.target.value })} className="admin-input" />
          </Field>
          <Field label="Срок, дней">
            <input type="number" min="0" step="1" value={form.durationDays ?? ""} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} className="admin-input" />
          </Field>
          <label className="flex items-center gap-3 pt-7 text-sm">
            <input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Показывать на сайте
          </label>
          <div className="md:col-span-2">
            <Field label="Описание">
              <textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="admin-input" />
            </Field>
          </div>
        </div>

        <button disabled={saving} className="mt-5 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
          {saving ? "Сохраняем…" : editingId ? "Сохранить изменения" : "Добавить услугу"}
        </button>
      </form>

      <section className="mt-8 rounded-md border border-border">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Список услуг</h2>
        </div>
        {loading ? <p className="px-5 py-6 text-sm text-muted">Загрузка…</p> : services.length === 0 ? <p className="px-5 py-6 text-sm text-muted">Услуг пока нет.</p> : (
          <div className="divide-y divide-border">
            {services.map((service) => (
              <article key={service.id} className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{service.name}</h3>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">{typeLabels[service.type]}</span>
                    {!service.isActive && <span className="rounded-full border border-red-500/40 px-2 py-0.5 text-[11px] text-red-400">Скрыта</span>}
                  </div>
                  {service.description && <p className="mt-1 max-w-2xl text-sm text-muted">{service.description}</p>}
                  <p className="mt-2 font-mono text-xs text-muted">
                    {formatServicePrice(service)} · {service.durationDays ? `${service.durationDays} дн.` : "срок не указан"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => startEdit(service)} className="rounded-md border border-border px-3 py-2 text-sm">Изменить</button>
                  <button type="button" onClick={() => handleDelete(service)} className="rounded-md border border-red-500/40 px-3 py-2 text-sm text-red-400">Удалить</button>
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

function formatServicePrice(service: Service) {
  if (service.priceFrom && service.priceTo) return `${Number(service.priceFrom).toLocaleString("ru-RU")}–${Number(service.priceTo).toLocaleString("ru-RU")} ₽`;
  if (service.priceFrom) return `от ${Number(service.priceFrom).toLocaleString("ru-RU")} ₽`;
  if (service.priceTo) return `до ${Number(service.priceTo).toLocaleString("ru-RU")} ₽`;
  return "Цена не указана";
}
