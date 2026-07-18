import { COMPANY } from "@/lib/company";
import { emailLayout, emailMuted, emailParagraph } from "@/lib/email/layout";
import { formatNaira } from "@/lib/domain";

export function activityNotificationEmailHtml(input: { title: string; body: string; ctaLabel?: string; ctaHref?: string }) {
  const cta =
    input.ctaLabel && input.ctaHref
      ? `<p style="margin:24px 0 0;text-align:center;"><a href="${input.ctaHref}" style="display:inline-block;padding:12px 24px;background:#047857;color:#fff;font-weight:600;text-decoration:none;border-radius:10px;">${input.ctaLabel}</a></p>`
      : "";

  return emailLayout({
    title: input.title,
    preview: input.body.slice(0, 120),
    body: `
      ${emailParagraph(input.body)}
      ${cta}
      ${emailMuted(`This is an automated message from ${COMPANY.brand}. If you did not perform this action, contact ${COMPANY.supportEmail} immediately.`)}
    `
  });
}

export function walletFundedEmailHtml(amount: number) {
  return activityNotificationEmailHtml({
    title: "Wallet funded",
    body: `Your wallet has been credited with ${formatNaira(amount)}. Funds are available for investment once verification is complete.`,
    ctaLabel: "View wallet",
    ctaHref: `${COMPANY.siteUrl}/wallet`
  });
}

export function payoutSubmittedEmailHtml(amount: number) {
  return activityNotificationEmailHtml({
    title: "Withdrawal request submitted",
    body: `We received your withdrawal request for ${formatNaira(amount)}. You will be notified when it is reviewed.`,
    ctaLabel: "Track withdrawal",
    ctaHref: `${COMPANY.siteUrl}/withdrawals`
  });
}

export function payoutApprovedEmailHtml(amount: number) {
  return activityNotificationEmailHtml({
    title: "Withdrawal approved",
    body: `Your withdrawal of ${formatNaira(amount)} has been approved and is being processed to your bank account.`,
    ctaLabel: "View withdrawals",
    ctaHref: `${COMPANY.siteUrl}/withdrawals`
  });
}

export function payoutRejectedEmailHtml(amount: number, reason?: string) {
  return activityNotificationEmailHtml({
    title: "Withdrawal declined",
    body: `Your withdrawal of ${formatNaira(amount)} was not approved.${reason ? ` ${reason}` : ""}`,
    ctaLabel: "View withdrawals",
    ctaHref: `${COMPANY.siteUrl}/withdrawals`
  });
}

export function investmentActivatedEmailHtml(amount: number, reference?: string) {
  return activityNotificationEmailHtml({
    title: "Investment activated",
    body: `Your investment of ${formatNaira(amount)}${reference ? ` (${reference})` : ""} is now active and accruing returns.`,
    ctaLabel: "View portfolio",
    ctaHref: `${COMPANY.siteUrl}/portfolio`
  });
}

export function newDeviceLoginEmailHtml() {
  return activityNotificationEmailHtml({
    title: "New device sign-in",
    body: "Your AltoRich account was signed in from a new browser or device. If this was you, no action is needed.",
    ctaLabel: "Review account",
    ctaHref: `${COMPANY.siteUrl}/settings`
  });
}

export function profileUpdatedEmailHtml() {
  return activityNotificationEmailHtml({
    title: "Profile updated",
    body: "Your AltoRich profile or security settings were updated successfully.",
    ctaLabel: "Open settings",
    ctaHref: `${COMPANY.siteUrl}/settings`
  });
}
