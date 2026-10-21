import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Контакты",
  "Контакты CustomPS в Нефтекамске: адрес, телефон, часы работы и форма связи.",
  "/contacts",
);

export default function ContactsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
