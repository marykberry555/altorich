import { cn } from "@/lib/utils";
import { LEADERSHIP_IMAGES, type LeadershipImageSlug } from "@/lib/leadership-images";

type Props = {
  slug: LeadershipImageSlug;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  sizes?: string;
};

export function LeadershipPortrait({
  slug,
  priority = false,
  className,
  imageClassName,
  sizes = "(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 320px"
}: Props) {
  const asset = LEADERSHIP_IMAGES[slug];
  const defaultVariant = asset.variants.find((v) => v.width === asset.defaultWidth) ?? asset.variants.at(-1)!;
  const srcSet = asset.variants.map((v) => `${v.src} ${v.width}w`).join(", ");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--gray-100)] shadow-[var(--shadow-md)] ring-1 ring-black/5",
        className
      )}
      style={{ aspectRatio: asset.aspectRatio }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={defaultVariant.src}
        srcSet={srcSet}
        sizes={sizes}
        alt={asset.alt}
        width={asset.defaultWidth}
        height={asset.defaultHeight}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={cn("absolute inset-0 h-full w-full object-cover object-top", imageClassName)}
      />
    </div>
  );
}
