import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getPublicServices, type Service } from "@/lib/api";

export const metadata = {
  title: "Услуги — CustomPS",
};

export default async function ServicesPage() {
  const services = await getPublicServices();

  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold">Услуги</h1>
        <p className="mt-3 max-w-xl text-muted">
          Не только продажа готовых ПК — полный цикл обслуживания техники:
          от подбора и сборки до ремонта и апгрейда.
        </p>

        {services.length === 0 ? (
          <div className="mt-10 rounded-md border border-border bg-surface p-6 text-sm text-muted">
            Сейчас услуги не опубликованы. Оставьте заявку, и мы свяжемся с вами.
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="flex flex-col justify-between rounded-md border border-border bg-surface p-6">
      <div>
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
          {serviceTypeLabel(service.type)}
        </span>
        <h2 className="mt-2 font-display text-lg font-semibold">{service.name}</h2>
        {service.description && <p className="mt-2 text-sm text-muted">{service.description}</p>}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 font-mono text-xs text-muted">
        <span>{formatServicePrice(service)}</span>
        <span>{service.durationDays ? `${service.durationDays} дн.` : "Срок уточняется"}</span>
      </div>

      <Link
        href={`/request?category=${encodeURIComponent(service.name)}`}
        className="mt-4 rounded-md border border-border px-4 py-2 text-center font-sans text-sm transition-colors hover:border-accent hover:bg-ink"
      >
        Заказать
      </Link>
    </div>
  );
}

function serviceTypeLabel(type: Service["type"]) {
  return {
    BUILD: "Сборка",
    UPGRADE: "Апгрейд",
    REPAIR: "Ремонт",
    MAINTENANCE: "Обслуживание",
  }[type];
}

function formatServicePrice(service: Service) {
  if (service.priceFrom && service.priceTo) return `${Number(service.priceFrom).toLocaleString("ru-RU")}–${Number(service.priceTo).toLocaleString("ru-RU")} ₽`;
  if (service.priceFrom) return `от ${Number(service.priceFrom).toLocaleString("ru-RU")} ₽`;
  if (service.priceTo) return `до ${Number(service.priceTo).toLocaleString("ru-RU")} ₽`;
  return "Цена уточняется";
}
