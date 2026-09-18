"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Component } from "@/lib/api";

type Props = {
  components: Component[];
  selectedId?: string;
  onSelect: (component: Component) => void;
  onEndReached?: () => void;
};

export function VirtualizedComponentGrid({ components, selectedId, onSelect, onEndReached }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 800, height: 620, top: 0 });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setViewport({ width: el.clientWidth, height: el.clientHeight, top: el.scrollTop });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    return () => { observer.disconnect(); el.removeEventListener("scroll", update); };
  }, []);

  const columns = viewport.width < 640 ? 1 : 2;
  const rowHeight = 156;
  const rowCount = Math.ceil(components.length / columns);
  const firstRow = Math.max(0, Math.floor(viewport.top / rowHeight) - 2);
  const lastRow = Math.min(rowCount, Math.ceil((viewport.top + viewport.height) / rowHeight) + 2);
  const visible = useMemo(() => components.slice(firstRow * columns, lastRow * columns), [components, firstRow, lastRow]);

  useEffect(() => {
    if (onEndReached && lastRow >= rowCount - 3 && rowCount > 0) onEndReached();
  }, [lastRow, rowCount, onEndReached]);

  return (
    <div ref={viewportRef} className="mt-5 h-[620px] overflow-auto rounded-md">
      <div style={{ height: rowCount * rowHeight, position: "relative" }}>
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          style={{ position: "absolute", top: firstRow * rowHeight, left: 0, right: 0, gridAutoRows: (rowHeight - 12) + "px" }}
        >
          {visible.map((component) => {
            const selected = selectedId === component.id;
            return (
              <button
                key={component.id}
                onClick={() => onSelect(component)}
                className={"rounded-md border p-4 text-left transition-colors " + (selected ? "border-accent bg-accent-soft" : "border-border hover:border-accent")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted">{component.manufacturer}</p>
                    <p className="mt-1 font-medium">{component.model}</p>
                  </div>
                  {selected && <span className="font-mono text-xs text-accent">✓</span>}
                </div>
                <div className="mt-4 flex items-center justify-between font-mono text-sm">
                  <span className="text-accent">{component.price == null ? "Цена не указана" : new Intl.NumberFormat("ru-RU").format(Number(component.price)) + " ₽"}</span>
                  <span className="text-xs text-muted">В наличии</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
