import type { ComponentCategory, Component, CompatibilityIssue } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type ConfiguratorValidation = {
  compatible: boolean;
  componentIds: string[];
  issues: CompatibilityIssue[];
};

export async function getConfiguratorCategories(): Promise<ComponentCategory[]> {
  const res = await fetch(`${API_URL}/configurator/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error("Не удалось загрузить категории");
  return res.json();
}

export async function getConfiguratorComponents(categoryId?: string): Promise<Component[]> {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
  const res = await fetch(`${API_URL}/configurator/components${query}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Не удалось загрузить комплектующие");
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
