import Link from "next/link";
import { getPcBuilds } from "@/lib/api";
import { PcBuildCard } from "@/components/pc-build-card";

const NAV_LINKS = [
  { href: "/pc", label: "Каталог ПК" },
  { href: "/configurator", label: "Конфигуратор" },
  { href: "/services", label: "Услуги" },
  { href: "/portfolio", label: "Портфолио" },
  { href: "/about", label: "О компании" },
  { href: "/contacts", label: "Контакты" },
];

const QUICK_PICKS = [
  { label: "Игровой ПК", purpose: "games" },
  { label: "Рабочий ПК", purpose: "work" },
  { label: "Для монтажа", purpose: "montage" },
  { label: "Для 3D", purpose: "3d" },
  { label: "Для AI", purpose: "ai" },
];

export default async function HomePage() {
  const builds = await getPcBuilds();

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-semibold">CustomPS</span>

          <nav className="hidden items-center gap-6 font-sans text-sm text-muted md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-text"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="https://www.avito.ru"
            target="_blank"
            className="font-sans text-sm text-muted transition-colors hover:text-text"
          >
            Авито
          </Link>
        </div>
      </header>

      <main>
        {/* Hero — раздел 7 ТЗ */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Соберём ПК под ваш бюджет
            </h1>
            <p className="mt-6 font-mono text-sm text-accent">
              Игры • Работа • 3D • Стриминг • AI
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/configurator"
                className="rounded-md bg-accent px-6 py-3 font-sans text-sm font-medium text-ink transition-colors hover:bg-accent-hover"
              >
                Подобрать ПК
              </Link>
              <Link
                href="/request"
                className="rounded-md border border-border px-6 py-3 font-sans text-sm font-medium transition-colors hover:border-accent"
              >
                Получить расчёт
              </Link>
            </div>
          </div>
        </section>

        {/* Быстрый подбор — раздел 8 ТЗ */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="font-display text-2xl font-semibold">
              Что вам нужно?
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {QUICK_PICKS.map((pick) => (
                <Link
                  key={pick.purpose}
                  href={`/configurator?purpose=${pick.purpose}`}
                  className="rounded-md border border-border px-4 py-6 text-center font-sans text-sm transition-colors hover:border-accent hover:bg-surface"
                >
                  {pick.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Популярные сборки — раздел 9 ТЗ, данные из backend API */}
        {builds.length > 0 && (
          <section className="border-t border-border">
            <div className="mx-auto max-w-6xl px-6 py-16">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-2xl font-semibold">
                  Популярные сборки
                </h2>
                <Link
                  href="/pc"
                  className="font-sans text-sm text-muted transition-colors hover:text-accent"
                >
                  Весь каталог →
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {builds.slice(0, 6).map((build) => (
                  <PcBuildCard key={build.id} build={build} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-10 font-sans text-sm text-muted">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span>CustomPS · Нефтекамск</span>
            <div className="flex gap-6">
              <Link href="/contacts" className="hover:text-text">
                Контакты
              </Link>
              <Link href="https://t.me" target="_blank" className="hover:text-text">
                Telegram
              </Link>
              <Link href="https://www.avito.ru" target="_blank" className="hover:text-text">
                Авито
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
