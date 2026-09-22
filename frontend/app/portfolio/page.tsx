import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatPrice, getPublicPortfolio, type PortfolioItem } from "@/lib/api";

export const metadata = { title: "Портфолио — CustomPS" };

export default async function PortfolioPage() {
  const items = await getPublicPortfolio();
  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold">Портфолио</h1>
        <p className="mt-3 max-w-2xl text-muted">Реальные сборки и результаты работ: задача клиента, комплектующие, тестирование и итог.</p>
        {items.length === 0 ? (
          <div className="mt-10 rounded-md border border-border bg-surface p-6 text-sm text-muted">Пока опубликованных работ нет.</div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => <PortfolioCard key={item.id} item={item} />)}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function PortfolioCard({ item }: { item: PortfolioItem }) {
  const image = item.images[0]?.url;
  return (
    <Link href={`/portfolio/${item.slug}`} className="group overflow-hidden rounded-md border border-border bg-surface">
      <div className="aspect-[16/10] bg-ink">
        {image ? <img src={image} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center text-sm text-muted">Фото пока нет</div>}
      </div>
      <div className="p-5">
        <h2 className="font-display text-lg font-semibold">{item.title}</h2>
        {item.clientTask && <p className="mt-2 line-clamp-3 text-sm text-muted">{item.clientTask}</p>}
        <p className="mt-4 font-mono text-xs text-muted">{item.budget ? formatPrice(item.budget) : "Бюджет не указан"} · {item.images.length} фото</p>
      </div>
    </Link>
  );
}
