import { logger } from "@/lib/logger";
import { COMPANY } from "@/lib/company";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.info("Email (dev fallback — not sent via Resend)", {
      to: input.to,
      subject: input.subject,
      replyTo: input.replyTo ?? COMPANY.supportEmail
    });
    return true;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: `${COMPANY.brand} <${COMPANY.supportEmail}>`,
      reply_to: input.replyTo ?? COMPANY.supportEmail,
      to: input.to,
      subject: input.subject,
      html: input.html
    })
  });

  if (!res.ok) {
    logger.warn("Failed to send email", { status: res.status, to: input.to, subject: input.subject });
    return false;
  }

  return true;
}
