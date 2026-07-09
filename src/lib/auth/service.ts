import { getServiceClientOrThrow } from "@/lib/auth/session";
import { AuthService } from "@/services/auth/auth.service";

export async function getAuthService() {
  const supabase = await getServiceClientOrThrow();
  return new AuthService(supabase);
}
