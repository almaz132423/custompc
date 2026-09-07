const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type PCBuild = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: string;
  purpose: string;
  resolution: string | null;
  warrantyMonths: number | null;
  buildTimeDays: number | null;
  images: { id: string; url: string; sortOrder: number }[];
  category: { id: string; name: string; slug: string } | null;
};

export async function getPcBuilds(): Promise<PCBuild[]> {
  try {
    const res = await fetch(`${API_URL}/pc-builds`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    // backend недоступен (не запущен) — на главной просто не покажем блок сборок
    return [];
  }
}

export function formatPrice(price: string): string {
  const value = Number(price);
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

const PURPOSE_LABELS: Record<string, string> = {
  GAMES: "Игры",
  WORK: "Работа",
  MONTAGE: "Монтаж",
  THREE_D: "3D",
  STREAMING: "Стриминг",
  AI: "AI",
  UNIVERSAL: "Универсальный",
};

export function purposeLabel(purpose: string): string {
  return PURPOSE_LABELS[purpose] ?? purpose;
}

const RESOLUTION_LABELS: Record<string, string> = {
  R1080P: "1080p",
  R1440P: "1440p",
  R4K: "4K",
};

export function resolutionLabel(resolution: string | null): string | null {
  if (!resolution) return null;
  return RESOLUTION_LABELS[resolution] ?? resolution;
}
