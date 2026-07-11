import { AdminLoginForm } from "@/components/auth/AdminLoginForm";

export default function AdminAppLoginPage() {
  return (
    <div className="admin-app-root flex min-h-dvh items-center justify-center bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-md">
        <AdminLoginForm
          intent="admin-app"
          successRedirect="/admin-app"
          title="Alto Rich Admin"
          subtitle="Installable operations console · administrators only"
          submitLabel="Sign in to Admin App"
        />
      </div>
    </div>
  );
}
