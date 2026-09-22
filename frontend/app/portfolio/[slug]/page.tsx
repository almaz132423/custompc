import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatPrice, getPublicPortfolioItem, type PortfolioItem } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function PortfolioDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getPublicPortfolioItem(slug);
  if (!item) notFound();

  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <Link href="/portfolio" className="text-sm text-muted hover:text-text">← Все работы</Link>
        <h1 className="mt-6 font-display text-3xl font-semibold">{item.title}</h1>
        {item.budget && <p className="mt-3 font-mono text-sm text-muted">Бюджет: {formatPrice(item.budget)}</p>}
        {item.images.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {item.images.map((image) => <img key={image.id} src={image.url} alt={item.title} className="w-full rounded-md border border-border object-cover" />)}
          </div>
        )}
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <Section title="Задача клиента" text={item.clientTask} />
          <Section title="Описание" text={item.description} />
          <Section title="Результат" text={item.result} />
          <Section title="Тестирование" text={item.testing} />
        </div>
        <Components value={item.components} />
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, text }: { title: string; text: string | null }) {
  if (!text) return null;
  return <section><h2 className="font-display text-xl font-semibold">{title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{text}</p></section>;
}

function Components({ value }: { value: unknown }) {
  if (!value) return null;
  return <section className="mt-10"><h2 className="font-display text-xl font-semibold">Комплектующие</h2><pre className="mt-3 overflow-x-auto rounded-md border border-border bg-surface p-5 text-xs leading-6 text-muted">{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</pre></section>;
}
