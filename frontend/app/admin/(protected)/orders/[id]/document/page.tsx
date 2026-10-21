"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getOrder, type AdminOrder } from "@/lib/api";

type DocumentKind = "sale" | "assembly";

function localDate(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(value: string) {
  if (!value) return "________________";
  return new Intl.DateTimeFormat("ru-RU").format(new Date(`${value}T00:00:00`));
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(value));
}

export default function OrderDocumentPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState("");
  const [kind, setKind] = useState<DocumentKind>("sale");
  const [sellerName, setSellerName] = useState("");
  const [sellerInn, setSellerInn] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [sellerContact, setSellerContact] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [place, setPlace] = useState("");
  const [documentDate, setDocumentDate] = useState(() => localDate(new Date()));
  const [deadline, setDeadline] = useState("");
  const [warranty, setWarranty] = useState("");
  const [workDescription, setWorkDescription] = useState("Сборка и первичная проверка ПК по согласованной конфигурации");

  useEffect(() => {
    getOrder(params.id).then(setOrder).catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить заказ");
    });
  }, [params.id]);

  const inputClass = "admin-input";
  const title = kind === "sale" ? "Договор-заказ на продажу компьютера" : "Договор-заказ на выполнение работ по сборке ПК";

  if (error) return <div role="alert" className="rounded-md border border-red-400/40 bg-red-400/10 p-4 text-sm">{error}</div>;
  if (!order) return <p className="text-sm text-muted">Загрузка заказа…</p>;
  const specifiedTotal = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const priceAdjustment = Number(order.totalPrice) - specifiedTotal;

  return (
    <div className="order-document-page">
      <div className="no-print mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-5">
        <h1 className="text-lg font-semibold">Проект печатного документа</h1>
        <p className="mt-2 text-sm">
          Это черновой шаблон, а не юридически проверенный договор. Перед передачей клиентам проверьте текст и реквизиты с юристом.
          Данные и условия ниже действуют только для этой печати; снимок документа в заказе не сохраняется.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">Вид документа
            <select className={`${inputClass} mt-1`} value={kind} onChange={(event) => setKind(event.target.value as DocumentKind)}>
              <option value="sale">Продажа ПК и комплектующих</option>
              <option value="assembly">Сборка из комплектующих заказчика</option>
            </select>
          </label>
          <label className="text-sm">Дата документа
            <input className={`${inputClass} mt-1`} type="date" value={documentDate} onChange={(event) => setDocumentDate(event.target.value)} />
          </label>
          <label className="text-sm">Место составления
            <input className={`${inputClass} mt-1`} value={place} onChange={(event) => setPlace(event.target.value)} placeholder="Город" />
          </label>
          <label className="text-sm">ФИО самозанятого
            <input className={`${inputClass} mt-1`} value={sellerName} onChange={(event) => setSellerName(event.target.value)} />
          </label>
          <label className="text-sm">ИНН исполнителя
            <input className={`${inputClass} mt-1`} value={sellerInn} onChange={(event) => setSellerInn(event.target.value)} inputMode="numeric" />
          </label>
          <label className="text-sm">Адрес исполнителя
            <input className={`${inputClass} mt-1`} value={sellerAddress} onChange={(event) => setSellerAddress(event.target.value)} />
          </label>
          <label className="text-sm">Телефон / email исполнителя
            <input className={`${inputClass} mt-1`} value={sellerContact} onChange={(event) => setSellerContact(event.target.value)} />
          </label>
          <label className="text-sm">Адрес заказчика
            <input className={`${inputClass} mt-1`} value={buyerAddress} onChange={(event) => setBuyerAddress(event.target.value)} />
          </label>
          <label className="text-sm">Срок выполнения / передачи
            <input className={`${inputClass} mt-1`} type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
          </label>
          <label className="text-sm">Гарантийные условия
            <input className={`${inputClass} mt-1`} value={warranty} onChange={(event) => setWarranty(event.target.value)} placeholder="Например, 12 месяцев" />
          </label>
          {kind === "assembly" && <label className="text-sm sm:col-span-2 lg:col-span-3">Описание работ
            <textarea className={`${inputClass} mt-1`} rows={2} value={workDescription} onChange={(event) => setWorkDescription(event.target.value)} />
          </label>}
        </div>
        <button type="button" onClick={() => window.print()} className="admin-button mt-5">Печать / сохранить в PDF</button>
      </div>

      <article className="contract-print">
        <p className="draft-notice">ПРОЕКТ ШАБЛОНА — требуется юридическая проверка перед использованием</p>
        <header className="document-header">
          <h1>{title}</h1>
          <p>№ {order.number}</p>
          <p>{place || "________________"} · {formatDate(documentDate)}</p>
        </header>

        <section className="document-section">
          <h2>1. Стороны</h2>
          <p>
            Самозанятый {sellerName || "________________________________"}, ИНН {sellerInn || "____________"},
            адрес: {sellerAddress || "________________________________"}, контакты: {sellerContact || "________________"},
            именуемый далее «Исполнитель», и {order.customer.name}, адрес: {buyerAddress || "________________________________"},
            телефон: {order.customer.phone || "не указан"}, email: {order.customer.email || "не указан"},
            именуемый далее «Заказчик», совместно согласовали заказ, указанный в настоящем документе.
          </p>
        </section>

        <section className="document-section">
          <h2>2. Предмет заказа</h2>
          {kind === "sale" ? (
            <p>Исполнитель обязуется передать Заказчику компьютер и/или комплектующие, перечисленные в спецификации, а Заказчик — принять и оплатить заказ на согласованных сторонами условиях.</p>
          ) : (
            <>
              <p>Исполнитель обязуется выполнить работы по сборке из комплектующих Заказчика. Состав заказа приведён ниже для идентификации согласованной конфигурации; принадлежность комплектующих и фактический объём работ должны быть подтверждены сторонами.</p>
              <p><strong>Описание работ:</strong> {workDescription || "________________________________"}</p>
            </>
          )}
        </section>

        <section className="document-section">
          <h2>3. Спецификация заказа</h2>
          <table>
            <thead><tr><th>№</th><th>Наименование</th><th>Кол-во</th>{kind === "sale" && <><th>Цена, ₽</th><th>Сумма, ₽</th></>}</tr></thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  {kind === "sale" && <><td>{formatMoney(item.price)}</td><td>{formatMoney(Number(item.price) * item.quantity)}</td></>}
                </tr>
              ))}
              {kind === "sale" && Math.abs(priceAdjustment) >= 0.01 && (
                <tr><td colSpan={4}>Корректировка до согласованной стоимости заказа</td><td>{formatMoney(priceAdjustment)}</td></tr>
              )}
              {kind === "assembly" && <tr><td colSpan={3}><strong>Стоимость работ по сборке</strong></td></tr>}
            </tbody>
            <tfoot><tr><th colSpan={kind === "sale" ? 4 : 2}>Итого по заказу</th><th>{formatMoney(order.totalPrice)} ₽</th></tr></tfoot>
          </table>
        </section>

        <section className="document-section">
          <h2>4. Срок, гарантия и условия</h2>
          <p>Согласованный срок выполнения работ / передачи заказа: {formatDate(deadline)}.</p>
          <p>Гарантийные условия: {warranty || "________________________________"}.</p>
          <p>Оплата и иные условия: {order.comment || "________________________________"}.</p>
          <p>Заказчику следует проверить описание заказа, стоимость, сроки и гарантийные условия до подписания. Условия передачи результата и порядок приёмки подлежат согласованию сторонами.</p>
        </section>

        <section className="signature-section">
          <div><strong>Исполнитель</strong><p>{sellerName || "________________________"}</p><p>Подпись: ____________________</p></div>
          <div><strong>Заказчик</strong><p>{order.customer.name}</p><p>Подпись: ____________________</p></div>
        </section>
      </article>

      <style jsx global>{`
        .contract-print {
          max-width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 18mm;
          background: white;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11pt;
          line-height: 1.45;
        }
        .contract-print h1 { margin: 0; font-size: 16pt; text-align: center; text-transform: uppercase; }
        .contract-print h2 { margin: 18px 0 8px; font-size: 12pt; }
        .contract-print p { margin: 8px 0; }
        .document-header { margin-bottom: 24px; text-align: center; }
        .document-section { margin-top: 16px; }
        .contract-print table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .contract-print th, .contract-print td { border: 1px solid #555; padding: 6px; text-align: left; vertical-align: top; }
        .contract-print th:first-child, .contract-print td:first-child,
        .contract-print th:nth-child(3), .contract-print td:nth-child(3) { text-align: center; }
        .contract-print tfoot th { text-align: right; }
        .draft-notice { border: 1px solid #9a3412; padding: 8px; color: #9a3412; font-size: 9pt; font-weight: bold; text-align: center; }
        .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 40px; }
        @page { size: A4; margin: 0; }
        @media print {
          body * { visibility: hidden !important; }
          .contract-print, .contract-print * { visibility: visible !important; }
          .contract-print { position: absolute; left: 0; top: 0; width: 210mm; max-width: none; min-height: 0; margin: 0; padding: 18mm; }
          .no-print { display: none !important; }
          .document-section, tr { break-inside: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>
    </div>
  );
}
