import type { ComponentCategory, Component, CompatibilityIssue } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type ConfiguratorValidation = {
  compatible: boolean;
  componentIds: string[];
  issues: CompatibilityIssue[];
};

export type CompatibleComponentsResponse = {
  components: Component[];
  excluded: { id: string; manufacturer: string; model: string; reasons: string[] }[];
};

export async function getConfiguratorCategories(): Promise<ComponentCategory[]> {
  const res = await fetch(`${API_URL}/configurator/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error("Не удалось загрузить категории");
  return res.json();
}

export async function getConfiguratorComponents(categoryId?: string, search?: string, offset = 0, limit = 40): Promise<{ components: Component[]; total: number; offset: number; limit: number; hasMore: boolean; nextOffset: number | null }> {
  const query = new URLSearchParams();\n  if (categoryId) query.set("categoryId", categoryId);\n  if (search) query.set("search", search);\n  query.set("offset", String(offset));\n  query.set("limit", String(limit));
  const res = await fetch(`${API_URL}/configurator/components?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Не удалось загрузить комплектующие");
  return res.json();
}

export async function getCompatibleConfiguratorComponents(categoryId: string, selectedIds: string[]): Promise<CompatibleComponentsResponse> {
  const query = new URLSearchParams({ categoryId, selectedIds: selectedIds.join(",") });
  const res = await fetch(`${API_URL}/configurator/compatible-components?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = data?.message;
    throw new Error(Array.isArray(message) ? message.join(", ") : message ?? "Не удалось подобрать совместимые комплектующие");
  }
  return res.json();
}

export async function validateConfigurator(componentIds: string[]): Promise<ConfiguratorValidation> {
  const res = await fetch(`${API_URL}/configurator/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ componentIds }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = data?.message;
    throw new Error(Array.isArray(message) ? message.join(", ") : message ?? "Не удалось проверить конфигурацию");
  }
  return res.json();
}
