import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold">Страница не найдена</h1>
      <p className="text-muted">Возможно, ссылка устарела или адрес введён с ошибкой.</p>
      <Link href="/" className="text-accent hover:underline">На главную</Link>
    </main>
  );
}
