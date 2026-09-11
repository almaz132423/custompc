import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getPcBuildBySlug,
  formatPrice,
  purposeLabel,
  resolutionLabel,
} from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function PcBuildPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const build = await getPcBuildBySlug(slug);

  if (!build) {
    notFound();
  }

  const image = build.images[0]?.url;
  const resolution = resolutionLabel(build.resolution);

  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 py-16">
        <Link
          href="/pc"
          className="font-mono text-xs text-muted transition-colors hover:text-accent"
        >
          ← Весь каталог
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-surface">
            {image ? (
              <Image
                src={image}
                alt={build.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-mono text-sm text-muted">
                фото сборки
              </div>
            )}
          </div>

          <div>
            <h1 className="font-display text-3xl font-semibold">
              {build.name}
            </h1>
            <p className="mt-3 font-mono text-2xl text-accent">
              {formatPrice(build.price)}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 font-mono text-xs text-muted">
              <span className="rounded border border-border px-2 py-1">
                {purposeLabel(build.purpose)}
              </span>
              {resolution && (
                <span className="rounded border border-border px-2 py-1">
                  {resolution}
                </span>
              )}
              {build.warrantyMonths && (
                <span className="rounded border border-border px-2 py-1">
                  Гарантия {build.warrantyMonths} мес
                </span>
              )}
              {build.buildTimeDays && (
                <span className="rounded border border-border px-2 py-1">
                  Сборка за {build.buildTimeDays} дн.
                </span>
              )}
            </div>

            {build.description && (
              <p className="mt-6 text-muted">{build.description}</p>
            )}

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/request?category=${encodeURIComponent("Покупка ПК")}&pcBuildId=${encodeURIComponent(build.id)}&purpose=${build.purpose}&budget=${build.price}`}
                className="rounded-md bg-accent px-6 py-3 font-sans text-sm font-medium text-ink transition-colors hover:bg-accent-hover"
              >
                Заказать
              </Link>
              <Link
                href="/configurator"
                className="rounded-md border border-border px-6 py-3 font-sans text-sm font-medium transition-colors hover:border-accent"
              >
                Изменить конфигурацию
              </Link>
              {build.avitoUrl && (
                <a
                  href={build.avitoUrl}
                  target="_blank"
                  className="rounded-md border border-border px-6 py-3 font-sans text-sm font-medium transition-colors hover:border-accent"
                >
                  Купить на Авито
                </a>
              )}
            </div>
          </div>
        </div>

        {build.components.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-xl font-semibold">
              Комплектующие
            </h2>
            <div className="mt-5 divide-y divide-border border-t border-border">
              {build.components.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 font-sans text-sm"
                >
                  <span className="text-muted">
                    {item.component.category?.name ?? "Компонент"}
                  </span>
                  <span className="font-mono">
                    {item.component.manufacturer} {item.component.model}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}