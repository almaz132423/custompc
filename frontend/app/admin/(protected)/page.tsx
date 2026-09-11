"use client";

import { useEffect, useState } from "react";
import { getLeads, purposeLabel, type Lead } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  CONTACTED: "Связались",
  CALCULATED: "Расчёт подготовлен",
  AGREED: "Согласовано",
  ORDER: "Заказ",
  REJECTED: "Отказ",
};

export default function AdminDashboardPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);

  useEffect(() => {
    getLeads().then(setLeads);
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Заявки</h1>
      <p className="mt-2 text-sm text-muted">
        {leads ? `Всего: ${leads.length}` : "Загрузка…"}
      </p>

      {leads && leads.length === 0 && (
        <p className="mt-10 text-muted">Пока нет ни одной заявки.</p>
      )}

      {leads && leads.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-md border border-border">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-xs text-muted">
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3">Имя</th>
                <th className="px-4 py-3">Контакт</th>
                <th className="px-4 py-3">Категория</th>
                <th className="px-4 py-3">ПК</th>
                <th className="px-4 py-3">Бюджет</th>
                <th className="px-4 py-3">Назначение</th>
                <th className="px-4 py-3">Статус</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {new Date(lead.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-4 py-3">{lead.name}</td>
                  <td className="px-4 py-3 font-mono">{lead.contact}</td>
                  <td className="px-4 py-3">{lead.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    {lead.pcBuildId ? (
                      <span className="font-mono text-xs" title={lead.pcBuildId}>
                        ПК выбран
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {lead.budget ? `${lead.budget} ₽` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {lead.purpose ? purposeLabel(lead.purpose) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded border border-border px-2 py-1 font-mono text-xs">
                      {STATUS_LABELS[lead.status] ?? lead.status}
                    </span>
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