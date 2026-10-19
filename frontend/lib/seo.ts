import type { Metadata } from "next";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const siteName = "CustomPS";

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export function pageMetadata(title: string, description: string, path: string, image?: string): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", locale: "ru_RU", siteName, title, description, url, ...(image ? { images: [{ url: new URL(image, siteUrl).toString() }] } : {}) },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}
