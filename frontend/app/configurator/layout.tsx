import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Конфигуратор ПК",
  "Подберите совместимые комплектующие и соберите конфигурацию компьютера под задачи и бюджет.",
  "/configurator",
);

export default function ConfiguratorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
