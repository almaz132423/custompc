"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLead, LeadStatus, createOrderFromLead, getLeads, updateLead, updateLeadStatus } from "@/lib/api";

const statuses: { value: LeadStatus; label: string }[] = [
  { value: "NEW", label: "Новая" },
  { value: "IN_PROGRESS", label: "В работе" },
  { value: "CONTACTED", label: "Связались" },
  { value: "CALCULATED", label: "Расчёт подготовлен" },
  { value: "AGREED", label: "Согласовано" },
  { value: "ORDER", label: "Заказ" },
  { value: "REJECTED", label: "Отказ" },
];

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [selected, setSelected] = useState<AdminLead | null>(null);
  const [status, setStatus] = useState<LeadStatus>("NEW");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [agreedPrice, setAgreedPrice] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await getLeads();
      setLeads(data);
      setSelected((current) => current ? data.find((lead) => lead.id === current.id) ?? null : data[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selected) {
      setStatus(selected.status);
      setComment("");
      setCustomerName(selected.customer?.name ?? selected.name);
      setCustomerContact(selected.customer?.email ?? selected.customer?.phone ?? selected.contact);
      setAgreedPrice(selected.agreedPrice ?? selected.budget ?? "");
    }
  }, [selected?.id, selected?.status]);

  const history = useMemo(() => selected?.statusHistory ?? [], [selected]);

  const transitions: Record<LeadStatus, LeadStatus[]> = {
    NEW: ["IN_PROGRESS", "REJECTED"],
    IN_PROGRESS: ["CONTACTED", "CALCULATED", "REJECTED"],
    CONTACTED: ["CALCULATED", "IN_PROGRESS", "REJECTED"],
    CALCULATED: ["AGREED", "IN_PROGRESS", "REJECTED"],
    AGREED: ["ORDER", "CALCULATED", "REJECTED"],
    ORDER: [],
    REJECTED: ["IN_PROGRESS", "NEW"],
  };
  const availableStatuses = [status, ...transitions[selected?.status ?? "NEW"]].filter((value, index, values) => values.indexOf(value) === index);

  async function createOrder() {
    if (!selected) return;
    setCreatingOrder(true);
    setError("");
    try {
      await createOrderFromLead(selected.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать заказ");
    } finally {
      setCreatingOrder(false);
    }
  }

  async function saveDetails() {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateLead(selected.id, {
        name: customerName.trim(),
        contact: customerContact.trim(),
        agreedPrice: agreedPrice.trim() || undefined,
      });
      setLeads((items) => items.map((item) => item.id === updated.id ? updated : item));
      setSelected(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить данные заявки");
    } finally {
      setSaving(false);
    }
  }

  async function saveStatus() {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateLeadStatus(selected.id, status, comment.trim() || undefined);
      setLeads((items) => items.map((item) => item.id === updated.id ? updated : item));
      setSelected(updated);
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось изменить статус");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Заявки</h1>
          <p className="mt-1 text-sm text-muted">Управление статусами и история изменений</p>
        </div>
        <button onClick={load} disabled={loading} className="admin-button-secondary">Обновить</button>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-400/40 bg-red-400/10 p-3 text-sm">{error}</div>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="overflow-hidden rounded-lg border border-border">
          {loading ? (
            <div className="p-6 text-sm text-muted">Загрузка заявок…</div>
          ) : leads.length === 0 ? (
            <div className="p-6 text-sm text-muted">Заявок пока нет.</div>
          ) : (
            <div className="divide-y divide-border">
              {leads.map((lead) => (
                <button key={lead.id} onClick={() => setSelected(lead)} className={`block w-full border-l-4 p-4 text-left hover:bg-black/5 ${selected?.id === lead.id ? "bg-black/5 border-accent" : lead.status === "NEW" ? "border-amber-400 bg-amber-400/5" : "border-transparent"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 font-medium"><span>{lead.name}</span>{lead.status === "NEW" && <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">Новая</span>}</div>
                      <div className="mt-1 text-sm text-muted">{lead.contact}</div>
                    </div>
                    <span className="rounded-full border border-border px-2 py-1 text-xs">{statuses.find((item) => item.value === lead.status)?.label ?? lead.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span>{new Date(lead.createdAt).toLocaleString("ru-RU")}</span>
                    {lead.category && <span>{lead.category}</span>}
                    {lead.budget && <span>Бюджет: {lead.budget} ₽</span>}{lead.agreedPrice && <span className="font-medium text-text">Согласовано: {lead.agreedPrice} ₽</span>}
                    {lead.pcBuild && <span>ПК: {lead.pcBuild.name}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {selected && (
          <aside className="rounded-lg border border-border p-5">
            <h2 className="text-lg font-semibold">{selected.name}</h2>
            <div className="mt-1 text-sm text-muted">{selected.contact}</div>

            <div className="mt-5 rounded-md border border-border bg-black/5 p-4">
              <h3 className="font-medium">Клиент и договорённость</h3>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className="text-sm font-medium">Имя клиента</span>
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="admin-input mt-2" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Телефон или email</span>
                  <input value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} className="admin-input mt-2" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Цена по договорённости, ₽</span>
                  <input value={agreedPrice} onChange={(e) => setAgreedPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="Например, 125000" className="admin-input mt-2" />
                </label>
                <button onClick={saveDetails} disabled={saving} className="admin-button w-full">
                  {saving ? "Сохраняем…" : "Сохранить данные клиента и цену"}
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Статус</span>
                <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} className="admin-input mt-2">
                  {statuses.filter((item) => availableStatuses.includes(item.value)).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium">Комментарий к изменению</span>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="Например: связались, клиент подтвердил бюджет…" className="admin-input mt-2 resize-y" />
              </label>
              <button onClick={saveStatus} disabled={saving || status === selected.status && !comment.trim()} className="admin-button w-full">
                {saving ? "Сохраняем…" : "Сохранить"}
              </button>
            </div>

            <div className="mt-8">
              <h3 className="font-medium">История</h3>
              <div className="mt-3 space-y-3">
                {history.length === 0 ? <p className="text-sm text-muted">История появится после первого изменения.</p> : history.map((item) => (
                  <div key={item.id} className="border-l-2 border-border pl-3">
                    <div className="text-sm font-medium">
                      {item.fromStatus ? statuses.find((s) => s.value === item.fromStatus)?.label : "Создание"} → {statuses.find((s) => s.value === item.toStatus)?.label}
                    </div>
                    <div className="mt-1 text-xs text-muted">{new Date(item.createdAt).toLocaleString("ru-RU")}</div>
                    {item.comment && <p className="mt-1 text-sm">{item.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
