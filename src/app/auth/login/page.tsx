import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function AuthLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-muted)]">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
