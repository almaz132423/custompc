"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatPrice, type Component, type ComponentCategory, type CompatibilityIssue } from "@/lib/api";
import { getCompatibleConfiguratorComponents, getConfiguratorCategories, validateConfigurator, type CompatibleComponentsResponse } from "@/lib/configurator-api";
import { VirtualizedComponentGrid } from "@/components/virtualized-component-grid";

const CATEGORY_ORDER = ["CPU", "MOTHERBOARD", "RAM", "GPU", "SSD", "PSU", "CASE", "COOLING"];
const CATEGORY_LABELS: Record<string, string> = {
  CPU: "Процессор",
  MOTHERBOARD: "Материнская плата",
  RAM: "Оперативная память",
  GPU: "Видеокарта",
  SSD: "Накопитель",
  PSU: "Блок питания",
  CASE: "Корпус",
  COOLING: "Охлаждение",
};

type Selection = Record<string, Component | undefined>;

export default function ConfiguratorPage() {
  const [categories, setCategories] = useState<ComponentCategory[]>([]);
  const [availableComponents, setAvailableComponents] = useState<Component[]>([]);
  const [excludedComponents, setExcludedComponents] = useState<CompatibleComponentsResponse["excluded"]>([]);
  const [selection, setSelection] = useState<Selection>({});
  const [activeCode, setActiveCode] = useState("CPU");
  const [search, setSearch] = useState("");
  const [issues, setIssues] = useState<CompatibilityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getConfiguratorCategories()
      .then((loadedCategories) => setCategories(loadedCategories.filter((category) => CATEGORY_ORDER.includes(category.code))))
      .catch((err) => setError(err instanceof Error ? err.message : "Не удалось загрузить конфигуратор"))
      .finally(() => setLoading(false));
  }, []);

  const orderedCategories = useMemo(
    () => [...categories].sort((a, b) => CATEGORY_ORDER.indexOf(a.code) - CATEGORY_ORDER.indexOf(b.code)),
    [categories],
  );

  const activeCategory = orderedCategories.find((category) => category.code === activeCode) ?? orderedCategories[0];
  const selectedComponents = orderedCategories.map((category) => selection[category.code]).filter(Boolean) as Component[];
  const selectedIds = useMemo(() => orderedCategories.map((category) => selection[category.code]).filter(Boolean).map((component) => (component as Component).id), [orderedCategories, selection]);
  const total = selectedComponents.reduce((sum, component) => sum + Number(component.price), 0);
  const completed = selectedComponents.length;
  const requestConfig = encodeURIComponent(JSON.stringify({
    type: "CUSTOM_CONFIG",
    componentIds: selectedComponents.map((component) => component.id),
    components: selectedComponents.map((component) => ({
      id: component.id,
      category: component.category.code,
      categoryName: CATEGORY_LABELS[component.category.code] ?? component.category.name,
      manufacturer: component.manufacturer,
      model: component.model,
      price: component.price,
    })),
    total: String(total),
  }));
  const requestHref = `/request?category=${encodeURIComponent("Конфигуратор")}&budget=${total}&configuration=${requestConfig}`;

  const loadComponents = useCallback(async (offset = 0, append = false) => {
    if (!activeCategory) return;
    if (append) setLoadingMore(true); else setFiltering(true);
    try {
      const result = await getCompatibleConfiguratorComponents(activeCategory.id, selectedIds, { search, offset, limit: 40 });
      setAvailableComponents((current) => append ? [...current, ...result.components] : result.components);
      setExcludedComponents((current) => append ? [...current, ...result.excluded] : result.excluded);
      setHasMore(result.hasMore);
      setNextOffset(result.nextOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось подобрать совместимые комплектующие");
    } finally {
      setFiltering(false);
      setLoadingMore(false);
    }
  }, [activeCategory?.id, selectedIds, search]);

  useEffect(() => {
    if (!activeCategory) return;
    setAvailableComponents([]);
    setExcludedComponents([]);
    setNextOffset(0);
    const timer = window.setTimeout(() => loadComponents(0, false), search.trim() ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [activeCategory?.id, selection, search, loadComponents]);

  const loadMore = useCallback(() => {
    if (!loadingMore && !filtering && hasMore && nextOffset !== null) loadComponents(nextOffset, true);
  }, [filtering, hasMore, loadComponents, loadingMore, nextOffset]);

