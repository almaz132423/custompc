import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata(
    "Заявка на сборку или консультацию",
    "Оставьте заявку на подбор компьютера, сборку, апгрейд или консультацию CustomPS.",
    "/request",
  ),
  robots: { index: false, follow: false },
};

export default function RequestLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
