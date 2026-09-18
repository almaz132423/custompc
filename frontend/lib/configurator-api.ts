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
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  nextOffset: number | null;
};

export async function getConfiguratorCategories(): Promise<ComponentCategory[]> {
  const res = await fetch(API_URL + "/configurator/categories", { cache: "no-store" });
  if (!res.ok) throw new Error("Не удалось загрузить категории");
  return res.json();
}

export async function getConfiguratorComponents(categoryId?: string, search?: string, offset = 0, limit = 40) {
  const query = new URLSearchParams();
  if (categoryId) query.set("categoryId", categoryId);
  if (search) query.set("search", search);
  query.set("offset", String(offset));
  query.set("limit", String(limit));
  const res = await fetch(API_URL + "/configurator/components?" + query.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Не удалось загрузить комплектующие");
  return res.json() as Promise<{ components: Component[]; total: number; offset: number; limit: number; hasMore: boolean; nextOffset: number | null }>;
}

export async function getCompatibleConfiguratorComponents(
  categoryId: string,
  selectedIds: string[],
  options: { search?: string; offset?: number; limit?: number } = {},
): Promise<CompatibleComponentsResponse> {
  const query = new URLSearchParams({
    categoryId,
    selectedIds: selectedIds.join(","),
    offset: String(options.offset ?? 0),
    limit: String(options.limit ?? 40),
  });
  if (options.search) query.set("search", options.search);
  const res = await fetch(API_URL + "/configurator/compatible-components?" + query.toString(), { cache: "no-store" });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = data?.message;
    throw new Error(Array.isArray(message) ? message.join(", ") : message ?? "Не удалось подобрать совместимые комплектующие");
  }
  return res.json();
}

export async function validateConfigurator(componentIds: string[]): Promise<ConfiguratorValidation> {
  const res = await fetch(API_URL + "/configurator/validate", {
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
