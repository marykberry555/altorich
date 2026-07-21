import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthPageFallback } from "@/components/auth/AuthPageFallback";

export default function AuthLoginPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <LoginForm />
    </Suspense>
  );
}
