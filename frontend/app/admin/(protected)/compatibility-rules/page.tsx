"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createCompatibilityRule,
  deleteCompatibilityRule,
  getCompatibilityRules,
  updateCompatibilityRule,
  type CompatibilityRule,
} from "@/lib/api";

const emptyForm = { name: "", description: "", rule: '{\n  "if": {\n    "category": "CPU",\n    "socket": "AM5"\n  },\n  "requires": {\n    "category": "MOTHERBOARD",\n    "socket": "AM5"\n  }\n}', isActive: true };

type RuleForm = typeof emptyForm;

const templates = [
  { name: "CPU → материнская плата", rule: { if: { category: "CPU", socket: "AM5" }, requires: { category: "MOTHERBOARD", socket: "AM5" } } },
  { name: "Материнская плата → RAM", rule: { if: { category: "MOTHERBOARD", ramType: "DDR5" }, requires: { category: "RAM", ramType: "DDR5" } } },
  { name: "CPU → охлаждение", rule: { if: { category: "CPU", socket: "AM5" }, requires: { category: "COOLING", socket: "AM5" } } },
];

export default function CompatibilityRulesPage() {
  const [rules, setRules] = useState<CompatibilityRule[]>([]);
  const [form, setForm] = useState<RuleForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try { setRules(await getCompatibilityRules()); }
    catch (err) { setError(err instanceof Error ? err.message : "Ошибка загрузки"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function startEdit(rule: CompatibilityRule) {
    setEditingId(rule.id);
    setForm({ name: rule.name, description: rule.description ?? "", rule: JSON.stringify(rule.rule, null, 2), isActive: rule.isActive });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() { setEditingId(null); setForm(emptyForm); }

  function applyTemplate(template: typeof templates[number]) {
    setForm((current) => ({ ...current, name: template.name, rule: JSON.stringify(template.rule, null, 2) }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      if (!form.name.trim()) throw new Error("Укажите название правила");
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(form.rule); } catch { throw new Error("Правило: некорректный JSON"); }
      if (!parsed.if || !parsed.requires || typeof parsed.if !== "object" || typeof parsed.requires !== "object") {
        throw new Error("Правило должно содержать объекты if и requires");
      }
      const input = { name: form.name.trim(), description: form.description.trim() || null, rule: parsed, isActive: form.isActive };
      if (editingId) await updateCompatibilityRule(editingId, input); else await createCompatibilityRule(input);
      reset(); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Не удалось сохранить правило"); }
    finally { setSaving(false); }
  }

  async function remove(rule: CompatibilityRule) {
    if (!window.confirm(`Удалить правило «${rule.name}»?`)) return;
    setError("");
    try { await deleteCompatibilityRule(rule.id); if (editingId === rule.id) reset(); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Не удалось удалить правило"); }
  }

  async function toggle(rule: CompatibilityRule) {
    setError("");
    try { await updateCompatibilityRule(rule.id, { isActive: !rule.isActive }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Не удалось изменить статус"); }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Правила совместимости</h1>
          <p className="mt-2 text-sm text-muted">Управление дополнительными правилами, которые учитываются валидатором сборки.</p>
        </div>
        <span className="font-mono text-xs text-muted">{rules.filter((rule) => rule.isActive).length} активных</span>
      </div>

      {error && <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">{error}</div>}

      <form onSubmit={submit} className="mt-8 rounded-md border border-border p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold">{editingId ? "Редактирование правила" : "Новое правило"}</h2>
          {editingId && <button type="button" onClick={reset} className="text-sm text-muted hover:text-text">Отмена</button>}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Название">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="admin-input" placeholder="CPU AM5 требует плату AM5" />
          </Field>
          <Field label="Описание" hint="Это сообщение увидит администратор при несовместимости.">
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" placeholder="Для процессора AM5 нужна материнская плата AM5" />
          </Field>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-sm font-medium">Правило JSON</span>
              <p className="mt-1 text-xs text-muted">Формат: <code>if</code> — найденный компонент, <code>requires</code> — обязательный компонент.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => <button key={template.name} type="button" onClick={() => applyTemplate(template)} className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-accent">{template.name}</button>)}
            </div>
          </div>
          <textarea value={form.rule} onChange={(e) => setForm({ ...form, rule: e.target.value })} rows={12} className="admin-input mt-2 font-mono text-xs" />
        </div>

        <label className="mt-4 flex items-center gap-3 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Правило активно
        </label>
        <button disabled={saving} className="mt-5 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? "Сохраняем…" : editingId ? "Сохранить изменения" : "Добавить правило"}</button>
      </form>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold">Список правил</h2>
        {loading ? <p className="mt-6 text-sm text-muted">Загрузка…</p> : rules.length === 0 ? <p className="mt-6 text-sm text-muted">Правил пока нет.</p> : (
          <div className="mt-4 space-y-3">
            {rules.map((rule) => (
              <article key={rule.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-medium">{rule.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${rule.isActive ? "bg-emerald-500/10 text-emerald-300" : "bg-white/5 text-muted"}`}>{rule.isActive ? "Активно" : "Выключено"}</span>
                    </div>
                    {rule.description && <p className="mt-1 text-sm text-muted">{rule.description}</p>}
                  </div>
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => toggle(rule)} className="text-muted hover:text-text">{rule.isActive ? "Выключить" : "Включить"}</button>
                    <button onClick={() => startEdit(rule)} className="text-accent hover:underline">Изменить</button>
                    <button onClick={() => remove(rule)} className="text-red-400 hover:underline">Удалить</button>
                  </div>
                </div>
                <pre className="mt-4 overflow-x-auto rounded-md bg-black/20 p-3 font-mono text-xs text-muted">{JSON.stringify(rule.rule, null, 2)}</pre>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-medium">{label}</span>{hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}<div className="mt-2">{children}</div></label>;
}
