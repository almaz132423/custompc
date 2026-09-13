"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMe, logout, type AdminUser } from "@/lib/api";

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null | undefined>(undefined);

  useEffect(() => {
    getMe().then((me) => {
      if (!me) router.replace("/admin/login");
      else setUser(me);
    });
  }, [router]);

  async function handleLogout() {
    await logout();
    router.replace("/admin/login");
  }

  if (user === undefined) {
    return <div className="flex min-h-screen items-center justify-center bg-ink"><p className="text-muted">Проверяем доступ…</p></div>;
  }
  if (user === null) return null;

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-display text-lg font-semibold">CustomPS · Админка</Link>
            <nav className="flex items-center gap-4 text-sm text-muted">
              <Link href="/admin" className="hover:text-text">Заявки</Link>
              <Link href="/admin/components" className="hover:text-text">Комплектующие</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 font-sans text-sm text-muted">
            <span>{user.email}</span>
            <button onClick={handleLogout} className="rounded-md border border-border px-3 py-1.5 transition-colors hover:border-accent hover:text-text">Выйти</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
