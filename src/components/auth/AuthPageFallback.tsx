import { AppLoader } from "@/components/brand/AppLoader";

/** Consistent auth route Suspense fallback. */
export function AuthPageFallback() {
  return <AppLoader compact className="min-h-screen" />;
}
