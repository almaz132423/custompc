import Link from "next/link";

export function SiteFooter() {
  return (
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
  );
}
