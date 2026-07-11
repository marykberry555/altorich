import Link from "next/link";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils/avatar";

type Props = {
  fullName: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  variant?: "default" | "sidebar";
};

const sizes = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-base"
};

export function MemberAvatar({ fullName, avatarUrl, size = "md", href = "/profile", className, variant = "default" }: Props) {
  const initials = getInitials(fullName);
  const dim = sizes[size];
  const onSidebar = variant === "sidebar";

  const avatar = (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1",
        onSidebar ? "bg-white/10 ring-white/20" : "bg-[var(--gray-100)] ring-[var(--border)]",
        dim,
        className
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className={cn("font-semibold tracking-tight", onSidebar ? "text-[var(--emerald-light)]" : "text-[var(--emerald)]")}>
          {initials}
        </span>
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
