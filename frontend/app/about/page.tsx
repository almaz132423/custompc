import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "О компании — CustomPS",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold">О компании</h1>
        <p className="mt-2 font-mono text-sm text-accent">Нефтекамск</p>

        <p className="mt-8 text-muted">
          CustomPS — локальная сборка и продажа компьютеров в Нефтекамске.
          Специализируемся на индивидуальном подборе конфигураций под
          конкретные задачи: игры, работу, монтаж, 3D, стриминг и AI —
          вместо того чтобы предлагать типовые решения "для всех".
        </p>

        <h2 className="mt-12 font-display text-xl font-semibold">
          Наш подход к сборке
        </h2>
        <ul className="mt-5 flex flex-col gap-3 text-muted">
          <li>— Индивидуальный подбор комплектующих под задачу и бюджет</li>
          <li>— Проверка совместимости всех компонентов перед сборкой</li>
          <li>— Тестирование готового ПК под нагрузкой перед выдачей</li>
          <li>— Гарантия на сборку и установленные комплектующие</li>
          <li>— Возможность лично приехать и проверить компьютер</li>
          <li>— Консультация перед покупкой — без давления и навязывания</li>
        </ul>

        <h2 className="mt-12 font-display text-xl font-semibold">
          Локальная работа
        </h2>
        <p className="mt-5 text-muted">
          Мы работаем в Нефтекамске — это значит, что забрать готовый
          компьютер, привезти его на диагностику или заглянуть на консультацию
          можно лично, без пересылки техники через транспортные компании.
        </p>

        <div className="mt-14 rounded-md border border-border bg-surface p-8 text-center">
          <p className="font-display text-lg font-semibold">
            Есть вопрос по сборке или ремонту?
          </p>
          <Link
            href="/request"
            className="mt-5 inline-block rounded-md bg-accent px-6 py-3 font-sans text-sm font-medium text-ink transition-colors hover:bg-accent-hover"
          >
            Получить консультацию
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
