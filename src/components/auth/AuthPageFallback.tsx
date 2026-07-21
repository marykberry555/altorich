import { AppLoader } from "@/components/brand/AppLoader";

/** Consistent auth route Suspense fallback — never a blank or framework spinner. */
export function AuthPageFallback() {
  return <AppLoader compact className="min-h-screen" message="Checking your account…" />;
}
