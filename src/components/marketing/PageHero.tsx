import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
};

export function PageHero({ eyebrow, title, description, align = "left", dark, className }: Props) {
  return (
    <div
      className={cn(
        align === "center" && "text-center",
        dark ? "text-white" : "text-[var(--text)]",
        className
      )}
    >
      {eyebrow ? (
        <p className={cn("text-xs font-semibold uppercase tracking-widest", dark ? "text-[var(--gold-light)]" : "text-[var(--emerald)]")}>
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">{title}</h1>
      {description ? (
        <p className={cn("mt-3 max-w-2xl text-base leading-relaxed sm:text-lg", dark ? "text-white/75" : "text-[var(--text-muted)]", align === "center" && "mx-auto")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
