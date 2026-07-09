"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { headerNav } from "@/content/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [packagesOpen, setPackagesOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-xl">
      <div className="container-ar flex h-[var(--header-h)] items-center justify-between gap-4">
        <BrandLogo priority />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {headerNav.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setPackagesOpen(true)}
                onMouseLeave={() => setPackagesOpen(false)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:text-[var(--emerald)]",
                    (isActive(item.href) || pathname.startsWith("/packages")) && "text-[var(--emerald)]"
                  )}
                >
                  {item.label}
                </Link>
                {packagesOpen ? (
                  <div className="absolute left-0 top-full pt-2">
                    <div className="min-w-[220px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] p-2 shadow-[var(--shadow-lg)]">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--gray-100)] hover:text-[var(--emerald)]"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:text-[var(--emerald)]",
                  isActive(item.href) && "text-[var(--emerald)]"
                )}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle compact />
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm" className="shadow-[var(--shadow-glow)]">
              Get Started
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle compact />
          <Link href="/auth/login" className="text-sm font-semibold text-[var(--emerald)]">
            Sign in
          </Link>
          <button type="button" className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[var(--border)] bg-[var(--surface-raised)] px-4 py-4 lg:hidden">
          {headerNav.map((item) =>
            item.children ? (
              <div key={item.label} className="border-b border-[var(--border)] py-3 last:border-0">
                <Link
                  href={item.href}
                  className="text-sm font-semibold text-[var(--heading)]"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
                <div className="mt-2 space-y-1 pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block py-1.5 text-sm text-[var(--text-muted)]"
                      onClick={() => setOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="block border-b border-[var(--border)] py-3 text-sm font-medium text-[var(--text)] last:border-0"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                Sign in
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="w-full shadow-[var(--shadow-glow)]">Get Started</Button>
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
