import { redirect } from "next/navigation";

/** Legacy PWA entry — always land on login (session continues to dashboard from there). */
export default function AppStartPage() {
  redirect("/auth/login");
}
