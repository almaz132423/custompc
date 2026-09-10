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
  avitoUrl: string | null;
  images: { id: string; url: string; sortOrder: number }[];
  category: { id: string; name: string; slug: string } | null;
};

export type PCBuildDetail = PCBuild & {
  components: {
    id: string;
    quantity: number;
    component: {
      id: string;
      manufacturer: string;
      model: string;
      category: { name: string } | null;
    };
  }[];
};

export async function getPcBuilds(): Promise<PCBuild[]> {
  try {
    const res = await fetch(`${API_URL}/pc-builds`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getPcBuildBySlug(
  slug: string,
): Promise<PCBuildDetail | null> {
  try {
    const res = await fetch(`${API_URL}/pc-builds/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export type RecommendParams = {
  purpose?: string;
  budget?: string;
  resolution?: string;
  priority?: string;
};

export async function getRecommendation(
  params: RecommendParams,
): Promise<PCBuild | null> {
  try {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => Boolean(v)) as [
        string,
        string,
      ][],
    );
    const res = await fetch(
      `${API_URL}/configurator/recommend?${query.toString()}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
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

const PRIORITY_LABELS: Record<string, string> = {
  MAX_FPS: "Максимум FPS",
  PRICE_PERFORMANCE: "Цена/производительность",
  SILENCE: "Тишина",
  APPEARANCE: "Внешний вид",
  UPGRADABILITY: "Возможность апгрейда",
};

export function priorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority] ?? priority;
}

// ---------- Авторизация (раздел 4.5, 32 ТЗ) ----------

export type AdminUser = {
  sub: string;
  email: string;
  role: "ADMIN" | "MANAGER";
};

export async function login(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, message: data?.message ?? "Не удалось войти" };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Backend недоступен" };
  }
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
}

export async function getMe(): Promise<AdminUser | null> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export type Lead = {
  id: string;
  name: string;
  contact: string;
  budget: string | null;
  purpose: string | null;
  category: string | null;
  status: string;
  comment: string | null;
  createdAt: string;
};

export async function getLeads(): Promise<Lead[]> {
  try {
    const res = await fetch(`${API_URL}/leads`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
