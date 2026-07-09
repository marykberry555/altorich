import { redirect } from "next/navigation";
import { getAuthService } from "@/lib/auth/service";
import { applySessionToCookies } from "@/lib/auth/apply-session";

type Props = {
  searchParams: Promise<{ email?: string; token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { email, token } = await searchParams;
  if (!email || !token) {
    redirect("/auth/login?error=invalid_link");
  }

  try {
    const auth = await getAuthService();
    const result = await auth.verifyMagicLink(email, token);
    await applySessionToCookies(result.session);
    redirect("/dashboard");
  } catch {
    redirect("/auth/login?error=expired_link");
  }
}
