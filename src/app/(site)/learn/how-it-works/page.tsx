import { redirect } from "next/navigation";

/** Legacy Knowledge Centre path — canonical page is /how-it-works */
export default function LearnHowItWorksRedirect() {
  redirect("/how-it-works");
}
