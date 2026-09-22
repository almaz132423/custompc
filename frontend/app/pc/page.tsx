import { getPcBuilds, type PcBuildCatalogParams } from "@/lib/api";
import { PcBuildCard } from "@/components/pc-build-card";
import { PcCatalogFilters } from "@/components/pc-catalog-filters";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Каталог ПК — CustomPS",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const get = (key: string) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const params: PcBuildCatalogParams = {
    minPrice: get("minPrice"),
    maxPrice: get("maxPrice"),
    purpose: get("purpose"),
    gpu: get("gpu"),
    cpu: get("cpu"),
    minRam: get("minRam"),
    minStorage: get("minStorage"),
    resolution: get("resolution"),
    sort: (get("sort") as PcBuildCatalogParams["sort"]) || "newest",
  };

  const builds = await getPcBuilds(params);

  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold">Каталог ПК</h1>
        <p className="mt-3 text-muted">
          Готовые сборки — закажите как есть или измените конфигурацию под себя.
        </p>

        <div className="mt-8">
          <PcCatalogFilters />
        </div>

        {builds.length === 0 ? (
          <div className="mt-10 rounded-md border border-border bg-surface p-8 text-center">
            <p className="text-muted">По выбранным параметрам сборок не найдено.</p>
            <p className="mt-2 text-sm text-muted">Попробуйте изменить фильтры или сбросить их.</p>
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm text-muted">Найдено сборок: {builds.length}</p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {builds.map((build) => (
                <PcBuildCard key={build.id} build={build} />
              ))}
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
