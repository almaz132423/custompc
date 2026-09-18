"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createComponent,
  deleteComponent,
  formatPrice,
  getComponentCategories,
  getComponents,
  updateComponent,
  type Component,
  type ComponentCategory,
} from "@/lib/api";
import { VirtualizedComponentTable } from "@/components/virtualized-component-table";

const emptyForm = {
  categoryId: "",
  manufacturer: "",
  model: "",
  price: "",
  imageUrl: "",
  specs: "",
  compatibility: "",
  inStock: true,
};

type ComponentForm = typeof emptyForm;
type CompatibilityField = { key: string; label: string; placeholder: string; type?: "text" | "number"; help?: string };
type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc" | "stock";

const compatibilityFields: Record<string, CompatibilityField[]> = {
  CPU: [{ key: "socket", label: "Сокет", placeholder: "AM5", help: "Должен совпадать с сокетом материнской платы и кулера." }],
  MOTHERBOARD: [
    { key: "socket", label: "Сокет CPU", placeholder: "AM5", help: "С каким сокетом процессора совместима плата." },
    { key: "ramType", label: "Тип памяти", placeholder: "DDR5", help: "Например DDR4 или DDR5." },
    { key: "formFactor", label: "Форм-фактор", placeholder: "ATX", help: "Например ATX, mATX, Mini-ITX." },
  ],
  RAM: [{ key: "ramType", label: "Тип памяти", placeholder: "DDR5", help: "Должен совпадать с поддерживаемым типом RAM у платы." }],
  COOLING: [
    { key: "socket", label: "Поддерживаемый сокет", placeholder: "AM5", help: "Сокет процессора, для которого подходит охлаждение." },
    { key: "heightMm", label: "Высота, мм", placeholder: "157", type: "number", help: "Нужна для проверки ограничения корпуса." },
  ],
  GPU: [
    { key: "lengthMm", label: "Длина видеокарты, мм", placeholder: "300", type: "number", help: "Нужна для проверки длины внутри корпуса." },
    { key: "powerW", label: "Потребление, Вт", placeholder: "220", type: "number", help: "Используется для проверки требований к БП." },
  ],
  CASE: [
    { key: "formFactor", label: "Поддерживаемый форм-фактор платы", placeholder: "ATX", help: "Например ATX, mATX, Mini-ITX." },
    { key: "gpuLengthMm", label: "Макс. длина GPU, мм", placeholder: "365", type: "number" },
    { key: "coolerHeightMm", label: "Макс. высота кулера, мм", placeholder: "165", type: "number" },
  ],
  PSU: [{ key: "wattage", label: "Мощность, Вт", placeholder: "750", type: "number", help: "Доступная мощность блока питания." }],
  SSD: [
    { key: "interface", label: "Интерфейс", placeholder: "NVMe", help: "Например NVMe или SATA." },
    { key: "formFactor", label: "Форм-фактор", placeholder: "M.2", help: "Например M.2 или 2.5-inch." },
  ],
  HDD: [
    { key: "interface", label: "Интерфейс", placeholder: "SATA", help: "Например SATA." },
    { key: "formFactor", label: "Форм-фактор", placeholder: "3.5-inch" },
  ],
};

const categoryExplanations: Record<string, string> = {
  CPU: "Для процессора главное — сокет. Например AM5 должен находить AM5 на материнской плате.",
  MOTHERBOARD: "Плата связывает CPU и RAM: укажите сокет процессора, тип памяти и форм-фактор.",
  RAM: "Тип памяти должен совпадать с поддерживаемым типом материнской платы.",
  GPU: "Длина и потребление помогают проверить корпус и требования к блоку питания.",
  PSU: "Укажите мощность БП — это основа проверки запаса по питанию.",
  CASE: "Корпус задаёт физические ограничения: формат платы, длину GPU и высоту кулера.",
  COOLING: "Укажите поддерживаемый сокет и при необходимости высоту кулера.",
  SSD: "Для накопителя обычно важны интерфейс и форм-фактор.",
  HDD: "Для HDD обычно важны интерфейс и форм-фактор.",
};

export default function AdminComponentsPage() {
  const [categories, setCategories] = useState<ComponentCategory[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "out">("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortOption>("name-asc");
  const [form, setForm] = useState<ComponentForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const selectedCategory = useMemo(() => categories.find((category) => category.id === form.categoryId), [categories, form.categoryId]);
  const fields = compatibilityFields[selectedCategory?.code ?? ""] ?? [];


