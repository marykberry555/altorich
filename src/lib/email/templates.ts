import { COMPANY } from "@/lib/company";
import { emailButton, emailCodeBlock, emailLayout, emailMuted, emailParagraph } from "@/lib/email/layout";

export function registrationVerificationEmailHtml(code: string, verifyLink: string) {
  return emailLayout({
    title: "Complete your registration",
    preview: `Verify your ${COMPANY.brand} account — code ${code} or use the link inside`,
    body: `
      ${emailParagraph(`Welcome to ${COMPANY.brand}. Verify your email to activate your account.`)}
      ${emailParagraph("Enter this 6-digit code on the verification screen:")}
      ${emailCodeBlock(code)}
      ${emailParagraph("Or verify in one click:")}
      ${emailButton(verifyLink, "Verify & sign in")}
      ${emailMuted("If the button does not work, copy and paste this link into your browser:")}
      <p style="margin:8px 0 0;font-size:11px;line-height:1.5;color:#94a3b8;word-break:break-all;">${verifyLink}</p>
      ${emailMuted("The code and link expire in 10 minutes. If you did not create an account, ignore this email.")}
    `
  });
}

export function welcomeEmailHtml(firstName: string) {
  const name = firstName.trim() || "Member";
  return emailLayout({
    title: "Welcome to AltoRich",
    preview: `Your ${COMPANY.brand} account is verified — you're ready to invest`,
    body: `
      ${emailParagraph(`Hi ${name},`)}
      ${emailParagraph("Your email is verified and your AltoRich account is active. You can now fund your wallet, explore investment sectors, and track everything from your dashboard.")}
      ${emailButton(`${COMPANY.siteUrl}/dashboard`, "Go to your dashboard")}
      ${emailParagraph(`Explore our <a href="${COMPANY.siteUrl}/packages" style="color:#047857;font-weight:600;text-decoration:none;">investment sectors</a> when you're ready.`)}
      ${emailMuted("Need help getting started? Visit our help centre or reply to this email.")}
    `
  });
}

export function deviceVerificationEmailHtml(code: string, verifyLink: string) {
  return emailLayout({
    title: "Verify your device",
    preview: `New sign-in to your ${COMPANY.brand} account — code ${code}`,
    body: `
      ${emailParagraph("We noticed a sign-in from a new device or browser. Enter this code on the sign-in screen, or verify in one click:")}
      ${emailCodeBlock(code)}
      ${emailParagraph("Or continue with this secure link (opens on this device):")}
      ${emailButton(verifyLink, "Verify this device")}
      ${emailMuted("If the button does not work, copy and paste this link into your browser:")}
      <p style="margin:8px 0 0;font-size:11px;line-height:1.5;color:#94a3b8;word-break:break-all;">${verifyLink}</p>
      ${emailMuted(`The code and link expire in 10 minutes. If this wasn't you, contact us at ${COMPANY.supportEmail} immediately.`)}
    `
  });
}

export function pinRecoveryEmailHtml(code: string) {
  return emailLayout({
    title: "Reset your PIN",
    preview: `Your ${COMPANY.brand} PIN recovery code: ${code}`,
    body: `
      ${emailParagraph("You requested to reset your 6-digit sign-in PIN. Enter this code on the recovery screen:")}
      ${emailCodeBlock(code)}
      ${emailButton(`${COMPANY.siteUrl}/auth/forgot-pin`, "Continue PIN reset")}
      ${emailMuted("If you did not request a PIN reset, ignore this email. Your PIN will stay unchanged.")}
    `
  });
}

export function otpEmailHtml(code: string, purpose: string) {
  return emailLayout({
    title: purpose,
    preview: `Your ${COMPANY.brand} verification code: ${code}`,
    body: `
      ${emailParagraph("Enter this verification code to continue. It expires in 10 minutes.")}
      ${emailCodeBlock(code)}
      ${emailMuted("If you did not request this, you can safely ignore this email.")}
    `
  });
}

export function usernameRecoveryEmailHtml(username: string) {
  return emailLayout({
    title: "Your username",
    preview: `Your ${COMPANY.brand} username reminder`,
    body: `
      ${emailParagraph(`You requested a username reminder for your ${COMPANY.brand} account.`)}
      <p style="margin:24px 0;font-size:24px;font-weight:700;text-align:center;color:#064e3b;">${username}</p>
      ${emailButton(`${COMPANY.siteUrl}/auth/login`, "Sign in to AltoRich")}
      ${emailMuted("If you did not request this, you can safely ignore this email.")}
    `
  });
}

export function magicLinkEmailHtml(link: string) {
  return emailLayout({
    title: "Verify your email",
    preview: `Verify your ${COMPANY.brand} email address`,
    body: `
      ${emailParagraph("Click the button below to verify your email and open your dashboard.")}
      ${emailButton(link, "Verify & sign in")}
      ${emailMuted("This link expires in 10 minutes. If the button does not work, copy and paste the link into your browser.")}
      <p style="margin:8px 0 0;font-size:11px;line-height:1.5;color:#94a3b8;word-break:break-all;">${link}</p>
    `
  });
}

export function contactInboxEmailHtml(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const safeMessage = input.message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return emailLayout({
    title: "New contact form message",
    preview: `[Contact] ${input.subject} from ${input.name}`,
    body: `
      ${emailParagraph("A visitor submitted the contact form on altorich.com.")}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 16px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:12px 16px;background:#f8fafc;font-size:12px;color:#64748b;width:90px;">From</td><td style="padding:12px 16px;font-size:14px;color:#0f172a;">${input.name} &lt;${input.email}&gt;</td></tr>
        <tr><td style="padding:12px 16px;background:#f8fafc;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">Subject</td><td style="padding:12px 16px;font-size:14px;color:#0f172a;border-top:1px solid #e2e8f0;">${input.subject}</td></tr>
      </table>
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Message</p>
      <p style="margin:0;padding:16px;background:#f8fafc;border-radius:12px;font-size:14px;line-height:1.65;color:#334155;white-space:pre-wrap;">${safeMessage}</p>
      ${emailButton(`mailto:${input.email}?subject=Re%3A%20${encodeURIComponent(input.subject)}`, "Reply to sender")}
    `
  });
}

export function contactAcknowledgementEmailHtml(input: { name: string; subject: string }) {
  const firstName = input.name.trim().split(/\s+/)[0] || "there";

  return emailLayout({
    title: "We received your message",
    preview: `Thanks for contacting ${COMPANY.brand} — we'll reply shortly`,
    body: `
      ${emailParagraph(`Hi ${firstName},`)}
      ${emailParagraph(`Thank you for reaching out to ${COMPANY.brand}. We have received your message regarding <strong style="color:#064e3b;">${input.subject}</strong> and a member of our team will reply to you shortly.`)}
      ${emailParagraph("Most enquiries are answered within one business day (West Africa Time).")}
      ${emailButton(COMPANY.siteUrl, "Visit AltoRich")}
      ${emailMuted(`This is an automated acknowledgement. Please do not reply to this email if you need urgent account support — use your dashboard or contact us again at ${COMPANY.supportEmail}.`)}
    `
  });
}

export type EmailSample = {
  id: string;
  name: string;
  subject: string;
  html: string;
};

export function getEmailSamples(): EmailSample[] {
  const sampleLink = `${COMPANY.siteUrl}/auth/verify?email=demo@altorich.com&token=sample-token`;
  const deviceLink = `${COMPANY.siteUrl}/auth/verify-device?email=demo@altorich.com&token=sample-device-token`;

  return [
    {
      id: "register-verify",
      name: "Registration verification (code + link)",
      subject: "Verify your AltoRich account",
      html: registrationVerificationEmailHtml("482916", sampleLink)
    },
    {
      id: "welcome",
      name: "Welcome (after verification)",
      subject: "Welcome to AltoRich",
      html: welcomeEmailHtml("Ada")
    },
    {
      id: "device-otp",
      name: "New device verification (OTP + link)",
      subject: "Verify your device",
      html: deviceVerificationEmailHtml("719304", deviceLink)
    },
    {
      id: "pin-recovery",
      name: "PIN recovery",
      subject: "Reset your AltoRich pin",
      html: pinRecoveryEmailHtml("530182")
    },
    {
      id: "username-recovery",
      name: "Username recovery",
      subject: "Your AltoRich username",
      html: usernameRecoveryEmailHtml("demouser")
    },
    {
      id: "contact-inbox",
      name: "Contact form (team inbox)",
      subject: "[Contact] Investment enquiry",
      html: contactInboxEmailHtml({
        name: "Ada Okonkwo",
        email: "ada@example.com",
        subject: "Investment enquiry",
        message: "Hello,\n\nI would like to learn more about the Growth investment sector and minimum deposit requirements.\n\nThank you."
      })
    },
    {
      id: "contact-ack",
      name: "Contact acknowledgement (visitor)",
      subject: "We received your message — AltoRich",
      html: contactAcknowledgementEmailHtml({ name: "Ada Okonkwo", subject: "Investment enquiry" })
    }
  ];
}
