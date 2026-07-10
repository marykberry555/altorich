import Link from "next/link";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils/avatar";

type Props = {
  fullName: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
};

const sizes = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-base"
};

export function MemberAvatar({ fullName, avatarUrl, size = "md", href = "/profile", className }: Props) {
  const initials = getInitials(fullName);
  const dim = sizes[size];

  const avatar = (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--gray-100)] ring-1 ring-[var(--border)]",
        dim,
        className
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="font-semibold tracking-tight text-[var(--emerald)]">{initials}</span>
      )}
    </span>
  );

  if (!href) return avatar;

  return (
    <Link href={href} className="shrink-0 transition hover:opacity-90" aria-label="Open profile">
      {avatar}
    </Link>
  );
}
