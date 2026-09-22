import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getPublicReviews, type Review } from "@/lib/api";

export const metadata = { title: "Отзывы — CustomPS" };

export default async function ReviewsPage() {
  const reviews = await getPublicReviews();
  return <div className="min-h-screen bg-ink"><SiteHeader /><main className="mx-auto max-w-6xl px-6 py-16">
    <h1 className="font-display text-3xl font-semibold">Отзывы клиентов</h1>
    <p className="mt-3 max-w-2xl text-muted">Отзывы о сборке, настройке и обслуживании компьютеров.</p>
    {reviews.length === 0 ? <div className="mt-10 rounded-md border border-border bg-surface p-6 text-sm text-muted">Пока опубликованных отзывов нет.</div> :
      <div className="mt-10 grid gap-5 md:grid-cols-2">{reviews.map(r => <ReviewCard key={r.id} review={r} />)}</div>}
  </main><SiteFooter /></div>;
}
function ReviewCard({ review }: { review: Review }) {
  return <article className="rounded-md border border-border bg-surface p-6">
    <div className="flex items-center justify-between gap-4"><div className="font-medium">{review.customerName}</div><span className="font-mono text-sm" aria-label={`Оценка: ${review.rating} из 5`}>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span></div>
    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">{review.text}</p>
    {review.purchasedBuild && <p className="mt-4 text-xs text-muted">{review.purchasedBuild}</p>}
    {review.photoUrl && <img src={review.photoUrl} alt={`Фото клиента ${review.customerName}`} className="mt-4 max-h-72 w-full rounded-md object-cover" />}
  </article>;
}
