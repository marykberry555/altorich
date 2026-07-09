import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--gray-50)] p-4">
      <Card variant="elevated" padding="lg" className="w-full max-w-md text-center">
        <h1 className="text-xl font-bold text-[var(--heading)]">Verify your email</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          We sent a confirmation link to your inbox. Click the link to activate your AltoRich account.
        </p>
        <p className="mt-4 text-xs text-[var(--text-subtle)]">
          Did not receive it? Check spam or contact support.
        </p>
        <Link href="/auth/login" className="mt-6 inline-block">
          <Button className="w-full">Return to sign in</Button>
        </Link>
      </Card>
    </div>
  );
}
