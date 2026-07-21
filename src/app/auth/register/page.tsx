import { RegisterForm } from "@/components/auth/RegisterForm";
import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthPageFallback } from "@/components/auth/AuthPageFallback";
import { COMPANY } from "@/lib/company";

const title = "Join Alto Rich";
const description =
  "Start building your wealth with Alto Rich. Use my referral link to join our growing investment community.";
const ogImage = `${COMPANY.siteUrl.replace(/\/$/, "")}/og/referral`;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: `${COMPANY.siteUrl.replace(/\/$/, "")}/auth/register`,
    siteName: "Alto Rich",
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: title }]
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage]
  }
};

export default function AuthRegisterPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
