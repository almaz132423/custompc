"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice, type Component } from "@/lib/api";

type Props = {
  components: Component[];
  onEdit: (component: Component) => void;
  onDelete: (component: Component) => void;
};

export function VirtualizedComponentTable({ components, onEdit, onDelete }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  const height = 620;
  const rowHeight = 92;
  const overscan = 4;
  const first = Math.max(0, Math.floor(top / rowHeight) - overscan);
  const last = Math.min(components.length, Math.ceil((top + height) / rowHeight) + overscan);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onScroll = () => setTop(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={viewportRef} className="h-[620px] overflow-auto rounded-md border border-border">
      <div className="relative" style={{ height: components.length * rowHeight }}>
        <div className="sticky top-0 z-10 grid grid-cols-[64px_140px_minmax(220px,1fr)_130px_120px_minmax(220px,1fr)_150px] border-b border-border bg-surface font-mono text-xs text-muted">
          <div className="px-4 py-3">Фото</div><div className="px-4 py-3">Категория</div><div className="px-4 py-3">Комплектующее</div><div className="px-4 py-3">Цена</div><div className="px-4 py-3">Статус</div><div className="px-4 py-3">Данные</div><div className="px-4 py-3 text-right">Действия</div>
        </div>
        <div style={{ position: "absolute", top: 44 + first * rowHeight, left: 0, right: 0 }}>
          {components.slice(first, last).map((component) => (
            <div key={component.id} className="grid h-[92px] grid-cols-[64px_140px_minmax(220px,1fr)_130px_120px_minmax(220px,1fr)_150px] items-center border-b border-border text-sm">
              <div className="px-4">{component.imageUrl ? <img src={component.imageUrl} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded border border-border text-[9px] text-muted">Нет</div>}</div>
              <div className="px-4 text-muted">{component.category.name}</div>
              <div className="px-4 font-medium">{component.manufacturer} {component.model}</div>
              <div className="px-4 whitespace-nowrap font-mono">{formatPrice(component.price)}</div>
              <div className="px-4 whitespace-nowrap">{component.inStock ? "В наличии" : "Нет в наличии"}</div>
              <div className="px-4 min-w-0"><details><summary className="cursor-pointer text-xs text-accent">Показать</summary><pre className="mt-1 max-h-20 overflow-auto rounded border border-border bg-black/10 p-2 font-mono text-[10px] whitespace-pre-wrap">{JSON.stringify({ specs: component.specs, compatibility: component.compatibility }, null, 2)}</pre></details></div>
              <div className="px-4 text-right whitespace-nowrap"><button onClick={() => onEdit(component)} className="mr-3 text-accent hover:underline">Изменить</button><button onClick={() => onDelete(component)} className="text-red-400 hover:underline">Удалить</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}