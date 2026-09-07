import Image from "next/image";
import Link from "next/link";
import {
  type PCBuild,
  formatPrice,
  purposeLabel,
  resolutionLabel,
} from "@/lib/api";

export function PcBuildCard({ build }: { build: PCBuild }) {
  const image = build.images[0]?.url;
  const resolution = resolutionLabel(build.resolution);

  return (
    <Link
      href={`/pc/${build.slug}`}
      className="group flex flex-col overflow-hidden rounded-md border border-border bg-surface transition-colors hover:border-accent"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink">
        {image ? (
          <Image
            src={image}
            alt={build.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-sm text-muted">
            фото сборки
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-tight">
            {build.name}
          </h3>
          <span className="font-mono text-lg text-accent">
            {formatPrice(build.price)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 font-mono text-xs text-muted">
          <span className="rounded border border-border px-2 py-1">
            {purposeLabel(build.purpose)}
          </span>
          {resolution && (
            <span className="rounded border border-border px-2 py-1">
              {resolution}
            </span>
          )}
          {build.warrantyMonths && (
            <span className="rounded border border-border px-2 py-1">
              Гарантия {build.warrantyMonths} мес
            </span>
          )}
        </div>

        {build.description && (
          <p className="text-sm text-muted">{build.description}</p>
        )}
      </div>
    </Link>
  );
}
