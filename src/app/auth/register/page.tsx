import { RegisterForm } from "@/components/auth/RegisterForm";
import { Suspense } from "react";

export default function AuthRegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-muted)]">AltoRich... Hold On</div>}>
      <RegisterForm />
    </Suspense>
  );
}
