import { logger } from "@/lib/logger";
import { COMPANY } from "@/lib/company";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendAuthEmail(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.info("Auth email (dev fallback)", { to: input.to, subject: input.subject, html: input.html });
    return true;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: `${COMPANY.brand} <noreply@${COMPANY.domain}>`,
      to: input.to,
      subject: input.subject,
      html: input.html
    })
  });

  if (!res.ok) {
    logger.warn("Failed to send auth email", { status: res.status, to: input.to });
    return false;
  }

  return true;
}

export function otpEmailHtml(code: string, purpose: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <p style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#064e3b">${COMPANY.brand}</p>
      <h1 style="font-size:20px;margin:12px 0 8px">${purpose}</h1>
      <p style="color:#475569;font-size:14px">Enter this verification code to continue. It expires in 10 minutes.</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:0.3em;margin:24px 0">${code}</p>
      <p style="font-size:12px;color:#94a3b8">If you did not request this, you can ignore this email.</p>
    </div>
  `;
}

export function usernameRecoveryEmailHtml(username: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <p style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#064e3b">${COMPANY.brand}</p>
      <h1 style="font-size:20px;margin:12px 0 8px">Your username</h1>
      <p style="color:#475569;font-size:14px">You requested a username reminder for your ${COMPANY.brand} account.</p>
      <p style="font-size:24px;font-weight:700;margin:24px 0">${username}</p>
      <p style="font-size:12px;color:#94a3b8">Sign in at ${COMPANY.siteUrl}/auth/login</p>
    </div>
  `;
}

export function magicLinkEmailHtml(link: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <p style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#064e3b">${COMPANY.brand}</p>
      <h1 style="font-size:20px;margin:12px 0 8px">Verify your email</h1>
      <p style="color:#475569;font-size:14px">Click the button below to verify your email and open your dashboard.</p>
      <p style="margin:24px 0"><a href="${link}" style="background:#064e3b;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600">Verify & sign in</a></p>
      <p style="font-size:12px;color:#94a3b8">This link expires in 10 minutes.</p>
    </div>
  `;
}
