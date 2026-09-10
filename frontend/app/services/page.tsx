import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Услуги — CustomPS",
};

// Пока раздаётся статично на фронтенде. Модель Service в Prisma-схеме уже
// готова под управление из админки (раздел 27, 41 ТЗ) — перенесём туда,
// когда дойдём до соответствующего раздела админки.
const SERVICES = [
  {
    title: "Сборка ПК",
    description: "Подберём комплектующие и соберём компьютер под ваши задачи и бюджет.",
    priceFrom: "от 3 000 ₽",
    duration: "1-3 дня",
  },
  {
    title: "Подбор комплектующих",
    description: "Поможем подобрать совместимые компоненты под конкретную задачу.",
    priceFrom: "бесплатно при заказе сборки",
    duration: "1 день",
  },
  {
    title: "Апгрейд",
    description: "Увеличим производительность существующего компьютера.",
    priceFrom: "от 1 500 ₽",
    duration: "1 день",
  },
  {
    title: "Ремонт",
    description: "Диагностика и устранение неисправностей.",
    priceFrom: "от 500 ₽",
    duration: "1-2 дня",
  },
  {
    title: "Диагностика",
    description: "Полная проверка компьютера, поиск причин сбоев и проблем.",
    priceFrom: "от 500 ₽",
    duration: "1 день",
  },
  {
    title: "Чистка и замена термопасты",
    description: "Профилактическое обслуживание — чистка от пыли, свежая термопаста.",
    priceFrom: "от 800 ₽",
    duration: "1 день",
  },
  {
    title: "Установка ОС и драйверов",
    description: "Установка и настройка Windows, всех необходимых драйверов.",
    priceFrom: "от 700 ₽",
    duration: "1 день",
  },
  {
    title: "Настройка BIOS и программ",
    description: "Тонкая настройка BIOS, установка и настройка нужных программ.",
    priceFrom: "от 500 ₽",
    duration: "1 день",
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold">Услуги</h1>
        <p className="mt-3 max-w-xl text-muted">
          Не только продажа готовых ПК — полный цикл обслуживания техники:
          от подбора и сборки до ремонта и апгрейда.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className="flex flex-col justify-between rounded-md border border-border bg-surface p-6"
            >
              <div>
                <h2 className="font-display text-lg font-semibold">
                  {service.title}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {service.description}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between font-mono text-xs text-muted">
                <span>{service.priceFrom}</span>
                <span>{service.duration}</span>
              </div>

              <Link
                href={`/request?category=${encodeURIComponent(service.title)}`}
                className="mt-4 rounded-md border border-border px-4 py-2 text-center font-sans text-sm transition-colors hover:border-accent hover:bg-ink"
              >
                Заказать
              </Link>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
