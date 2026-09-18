"use client";

import { useEffect, useState } from "react";
import { AdminOrder, getOrders } from "@/lib/api";

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
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">Статус</dt><dd>{orderStatuses[selected.status] ?? selected.status}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Оплата</dt><dd>{paymentStatuses[selected.paymentStatus] ?? selected.paymentStatus}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Стоимость</dt><dd>{selected.totalPrice} ₽</dd></div>
            {selected.costPrice && <div className="flex justify-between gap-4"><dt className="text-muted">Себестоимость</dt><dd>{selected.costPrice} ₽</dd></div>}
            {selected.profit && <div className="flex justify-between gap-4"><dt className="text-muted">Прибыль</dt><dd>{selected.profit} ₽</dd></div>}
          </dl>

          <h3 className="mt-7 font-medium">Состав заказа</h3>
          <div className="mt-3 space-y-2">
            {selected.items.map((item) => <div key={item.id} className="flex justify-between gap-4 border-b border-border pb-2 text-sm"><span>{item.name} × {item.quantity}</span><span>{item.price} ₽</span></div>)}
          </div>

          {selected.lead && <div className="mt-6 rounded-md border border-border p-3 text-sm"><div className="font-medium">Исходная заявка</div><div className="mt-1 text-muted">{selected.lead.name} · {selected.lead.contact}</div></div>}
          {selected.comment && <div className="mt-4 text-sm"><span className="text-muted">Комментарий: </span>{selected.comment}</div>}
        </aside>}
      </div>
    </main>
  );
}
