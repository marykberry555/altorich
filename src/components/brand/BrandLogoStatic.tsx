import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

type Props = {
  variant?: "full" | "icon";
  className?: string;
  href?: string | null;
  priority?: boolean;
};

/** Server-safe logo — swaps via CSS `data-theme` without client JS */
export function BrandLogoStatic({ variant = "full", className, href = "/", priority }: Props) {
  const isIcon = variant === "icon";
  const light = isIcon ? BRAND.icon.light : BRAND.logo.light;
  const dark = isIcon ? BRAND.icon.dark : BRAND.logo.dark;
  const w = isIcon ? 36 : 148;
  const h = isIcon ? 36 : 40;

  const img = (
    <span className={cn("brand-plate relative inline-flex items-center", className)}>
      <Image
        src={light}
        alt="AltoRich"
        width={w}
        height={h}
        priority={priority}
        className={cn("brand-logo-light h-auto w-auto object-contain", isIcon ? "max-h-9 max-w-9" : "max-h-9")}
      />
      <Image
        src={dark}
        alt=""
        width={w}
        height={h}
        aria-hidden
        className={cn("brand-logo-dark h-auto w-auto object-contain", isIcon ? "max-h-9 max-w-9" : "max-h-9")}
      />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0">
        {img}
      </Link>
    );
  }

  return img;
}
