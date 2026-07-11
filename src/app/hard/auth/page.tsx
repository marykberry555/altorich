import { redirect } from "next/navigation";

export default function HardAuthRedirectPage() {
  redirect("/auth/login");
}
