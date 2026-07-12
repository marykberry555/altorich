import { AdminLoginForm } from "@/components/auth/AdminLoginForm";

export const dynamic = "force-dynamic";

/** Canonical admin authentication entry — shared by web ops and native Android app. */
export default function AdminAuthPage() {
  return (
    <div className="admin-app-root flex min-h-dvh items-center justify-center bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-md">
        <AdminLoginForm
          intent="admin-app"
          shell="minimal"
          successRedirect="/admin-app"
          title="Alto Rich Admin"
          subtitle="Secure operations sign-in · administrators only"
          submitLabel="Sign in"
        />
      </div>
    </div>
  );
}
