import type { Metadata } from "next";
import { COMPANY } from "@/lib/company";
import {
  REFERRAL_INVALID_MESSAGE,
  buildRegisterUrlWithRef,
  normalizeReferralCode
} from "@/lib/referral/attribution";
import { resolveReferralCode } from "@/lib/referral/resolve";
import { ReferralLandingClient } from "@/components/referral/ReferralLandingClient";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code: raw } = await params;
  const code = normalizeReferralCode(raw) ?? raw.toUpperCase();
  let referrerName = "a friend";
  try {
    const resolved = await resolveReferralCode(code);
    referrerName = resolved.referrerName.split(/\s+/)[0] || referrerName;
  } catch {
    // Still show branded preview for invalid codes so shares look premium.
  }

  const title = "Join Alto Rich";
  const description =
    "Start building your wealth with Alto Rich. Use my referral link to join our growing investment community.";
  const canonical = `${COMPANY.siteUrl.replace(/\/$/, "")}/r/${encodeURIComponent(code)}`;
  const ogImage = `${COMPANY.siteUrl.replace(/\/$/, "")}/og/referral?name=${encodeURIComponent(referrerName)}&code=${encodeURIComponent(code)}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false }
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Alto Rich",
      type: "website",
      locale: "en_NG",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage]
    }
  };
}

/** Served to social preview crawlers (humans are redirected in middleware). */
export default async function ReferralShortLinkPage({ params }: Props) {
  const { code: raw } = await params;
  const code = normalizeReferralCode(raw);

  if (!code) {
    return (
      <ReferralLandingClient
        code=""
        referrerName={null}
        invalid
        invalidMessage={REFERRAL_INVALID_MESSAGE}
        registerHref="/auth/register"
      />
    );
  }

  let referrerName: string | null = null;
  let invalid = false;
  try {
    const resolved = await resolveReferralCode(code);
    referrerName = resolved.referrerName;
  } catch {
    invalid = true;
  }

  return (
    <ReferralLandingClient
      code={code}
      referrerName={referrerName}
      invalid={invalid}
      invalidMessage={REFERRAL_INVALID_MESSAGE}
      registerHref={buildRegisterUrlWithRef(code)}
    />
  );
}
