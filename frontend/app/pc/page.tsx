import { getPcBuilds } from "@/lib/api";
import { PcBuildCard } from "@/components/pc-build-card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Каталог ПК — CustomPS",
};

export default async function CatalogPage() {
  const builds = await getPcBuilds();

  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold">Каталог ПК</h1>
        <p className="mt-3 text-muted">
          Готовые сборки — закажите как есть или измените конфигурацию под
          себя.
        </p>

        {builds.length === 0 ? (
          <p className="mt-10 text-muted">
            Пока нет доступных сборок. Загляните позже или оставьте заявку —
            подберём индивидуально.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {builds.map((build) => (
              <PcBuildCard key={build.id} build={build} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
