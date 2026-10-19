import type { MetadataRoute } from "next";
import { getPcBuilds, getPublicPortfolio } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["/", "/pc", "/services", "/portfolio", "/configurator", "/contacts"];
  const [builds, portfolio] = await Promise.all([getPcBuilds(), getPublicPortfolio()]);
  const paths = [...staticPaths, ...builds.map((build) => "/pc/" + encodeURIComponent(build.slug)), ...portfolio.map((item) => "/portfolio/" + encodeURIComponent(item.slug))];
  return [...new Set(paths)].map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
