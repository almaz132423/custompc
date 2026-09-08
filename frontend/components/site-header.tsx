import Link from "next/link";

const NAV_LINKS = [
  { href: "/pc", label: "Каталог ПК" },
  { href: "/configurator", label: "Конфигуратор" },
  { href: "/services", label: "Услуги" },
  { href: "/portfolio", label: "Портфолио" },
  { href: "/about", label: "О компании" },
  { href: "/contacts", label: "Контакты" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-lg font-semibold">
          CustomPS
        </Link>

        <nav className="hidden items-center gap-6 font-sans text-sm text-muted md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="https://www.avito.ru"
          target="_blank"
          className="font-sans text-sm text-muted transition-colors hover:text-text"
        >
          Авито
        </Link>
      </div>
    </header>
  );
}
