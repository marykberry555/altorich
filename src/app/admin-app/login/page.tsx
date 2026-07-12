import { redirect } from "next/navigation";

/** Legacy path — canonical admin login is /admin/auth */
export default function AdminAppLoginRedirect() {
  redirect("/admin/auth");
}
