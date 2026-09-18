"use client";

import { useEffect, useState } from "react";
import { AdminOrder, OrderStatus, PaymentStatus, addOrderPayment, getOrders, updateOrder } from "@/lib/api";

const orderStatuses: Record<string, string> = {
  NEW: "Новый",
  AWAITING_PAYMENT: "Ожидает оплаты",
  PAID: "Оплачен",
  PURCHASING: "Закупка",
  COMPONENTS_RECEIVED: "Комплектующие получены",
  ASSEMBLY: "Сборка",
  TESTING: "Тестирование",
  READY: "Готов",
  ISSUED: "Выдан",
  COMPLETED: "Завершён",
};

const paymentStatuses: Record<string, string> = {
  UNPAID: "Не оплачено",
  PARTIALLY_PAID: "Частично оплачено",
  PAID: "Оплачено",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<OrderStatus>("NEW");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("UNPAID");
  const [orderComment, setOrderComment] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
      setSelected((current) => current ? data.find((order) => order.id === current.id) ?? null : data[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить заказы");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selected) { setStatus(selected.status as OrderStatus); setPaymentStatus(selected.paymentStatus as PaymentStatus); setOrderComment(""); } }, [selected?.id, selected?.status, selected?.paymentStatus]);

  async function saveOrder() {
    if (!selected) return;
    setSaving(true); setError("");
    try { const updated = await updateOrder(selected.id, { status, paymentStatus, comment: orderComment.trim() || undefined }); setOrders(items => items.map(item => item.id === updated.id ? updated : item)); setSelected(updated); setOrderComment(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Не удалось сохранить заказ"); }
    finally { setSaving(false); }
  }

  async function savePayment() {
    if (!selected || !paymentAmount) return;
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) { setError("Укажите корректную сумму оплаты"); return; }
    setSaving(true); setError("");
    try { const updated = await addOrderPayment(selected.id, amount, paymentMethod.trim() || undefined); setOrders(items => items.map(item => item.id === updated.id ? updated : item)); setSelected(updated); setPaymentAmount(""); setPaymentMethod(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Не удалось добавить оплату"); }
    finally { setSaving(false); }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Заказы</h1>
          <p className="mt-1 text-sm text-muted">Заказы, созданные из согласованных заявок</p>
        </div>
        <button onClick={load} disabled={loading} className="admin-button-secondary">Обновить</button>
      </div>
      {error && <div className="mb-4 rounded-md border border-red-400/40 bg-red-400/10 p-3 text-sm">{error}</div>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="overflow-hidden rounded-lg border border-border">
          {loading ? <div className="p-6 text-sm text-muted">Загрузка заказов…</div> : orders.length === 0 ? <div className="p-6 text-sm text-muted">Заказов пока нет.</div> : (
            <div className="divide-y divide-border">
              {orders.map((order) => (
                <button key={order.id} onClick={() => setSelected(order)} className={`block w-full p-4 text-left hover:bg-black/5 ${selected?.id === order.id ? "bg-black/5" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div><div className="font-medium">{order.number}</div><div className="mt-1 text-sm text-muted">{order.customer.name} · {order.customer.phone}</div></div>
                    <span className="rounded-full border border-border px-2 py-1 text-xs">{orderStatuses[order.status] ?? order.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span>{new Date(order.createdAt).toLocaleString("ru-RU")}</span>
                    <span>{order.totalPrice} ₽</span>
                    <span>{paymentStatuses[order.paymentStatus] ?? order.paymentStatus}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {selected && <aside className="rounded-lg border border-border p-5">
          <h2 className="text-lg font-semibold">{selected.number}</h2>
          <div className="mt-1 text-sm text-muted">{selected.customer.name} · {selected.customer.phone}</div>
          <div className="mt-5 space-y-4">
            <label className="block text-sm"><span className="font-medium">Статус выполнения</span><select value={status} onChange={e => setStatus(e.target.value as OrderStatus)} className="admin-input mt-2">{Object.entries(orderStatuses).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="block text-sm"><span className="font-medium">Статус оплаты</span><select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as PaymentStatus)} className="admin-input mt-2">{Object.entries(paymentStatuses).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="block text-sm"><span className="font-medium">Комментарий</span><textarea value={orderComment} onChange={e => setOrderComment(e.target.value)} rows={3} className="admin-input mt-2" placeholder="Комментарий по заказу или изменению статуса" /></label>
            <button onClick={saveOrder} disabled={saving} className="admin-button w-full">{saving ? "Сохраняем…" : "Сохранить изменения"}</button>
          </div>
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">Статус</dt><dd>{orderStatuses[selected.status] ?? selected.status}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Оплата</dt><dd>{paymentStatuses[selected.paymentStatus] ?? selected.paymentStatus}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Стоимость</dt><dd>{selected.totalPrice} ₽</dd></div>
            {selected.costPrice && <div className="flex justify-between gap-4"><dt className="text-muted">Себестоимость</dt><dd>{selected.costPrice} ₽</dd></div>}
            {selected.profit && <div className="flex justify-between gap-4"><dt className="text-muted">Прибыль</dt><dd>{selected.profit} ₽</dd></div>}
          </dl>

          <h3 className="mt-7 font-medium">Оплата</h3>
          <div className="mt-3 rounded-md border border-border p-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">Внесено</span><span>{(selected.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)} ₽</span></div>
            <div className="mt-1 flex justify-between"><span className="text-muted">Остаток</span><span>{Math.max(0, Number(selected.totalPrice) - (selected.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)).toFixed(2)} ₽</span></div>
            <div className="mt-3 grid gap-2"><input value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} type="number" min="0.01" step="0.01" placeholder="Сумма платежа" className="admin-input" /><input value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} placeholder="Способ оплаты" className="admin-input" /><button onClick={savePayment} disabled={saving || !paymentAmount} className="admin-button-secondary">Добавить оплату</button></div>
          </div>
          <h3 className="mt-7 font-medium">Состав заказа</h3>
          <div className="mt-3 space-y-2">
            {selected.items.map((item) => <div key={item.id} className="flex justify-between gap-4 border-b border-border pb-2 text-sm"><span>{item.name} × {item.quantity}</span><span>{item.price} ₽</span></div>)}
          </div>

          {selected.lead && <div className="mt-6 rounded-md border border-border p-3 text-sm"><div className="font-medium">Исходная заявка</div><div className="mt-1 text-muted">{selected.lead.name} · {selected.lead.contact}</div></div>}
          {selected.comment && <div className="mt-4 text-sm"><span className="text-muted">Комментарий: </span>{selected.comment}</div>}
          <h3 className="mt-7 font-medium">История статусов</h3><div className="mt-3 space-y-3">{(selected.statusHistory ?? []).length === 0 ? <p className="text-sm text-muted">Изменений пока нет.</p> : (selected.statusHistory ?? []).map(item => <div key={item.id} className="border-l-2 border-border pl-3 text-sm"><div>{item.fromStatus ? orderStatuses[item.fromStatus] : "Создание"} → {orderStatuses[item.toStatus] ?? item.toStatus}</div><div className="mt-1 text-xs text-muted">{new Date(item.createdAt).toLocaleString("ru-RU")}</div>{item.comment && <div className="mt-1">{item.comment}</div>}</div>)}</div>
        </aside>}
      </div>
    </main>
  );
}
