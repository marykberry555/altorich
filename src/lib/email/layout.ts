import { COMPANY } from "@/lib/company";
import { OFFICIAL_SOCIAL_CHANNELS } from "@/lib/social/official-channels";

type EmailLayoutOptions = {
  title: string;
  body: string;
  preview?: string;
};

function emailSocialFooter() {
  const links = OFFICIAL_SOCIAL_CHANNELS.map(
    (c) =>
      `<a href="${c.href}" style="color:#047857;text-decoration:none;font-weight:600;margin-right:12px;" target="_blank" rel="noopener noreferrer">${c.label}</a>`
  ).join("");

  return `<p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#64748b;">Follow us: ${links}</p>`;
}

export function emailLayout({ title, body, preview }: EmailLayoutOptions): string {
  const previewText = preview ?? title;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${previewText}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b 0%,#047857 100%);padding:28px 32px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#a7f3d0;font-weight:600;">${COMPANY.brand}</p>
              <h1 style="margin:10px 0 0;font-size:22px;line-height:1.3;color:#ffffff;font-weight:700;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;" />
              <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#64748b;">
                Questions? Reply to this email or write to
                <a href="mailto:${COMPANY.supportEmail}" style="color:#047857;text-decoration:none;font-weight:600;">${COMPANY.supportEmail}</a>
              </p>
              ${emailSocialFooter()}
              <p style="margin:12px 0 0;font-size:11px;line-height:1.6;color:#94a3b8;">
                ${COMPANY.legalName} · ${COMPANY.addressFull}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailButton(href: string, label: string): string {
  return `<p style="margin:28px 0 8px;text-align:center;">
    <a href="${href}" style="display:inline-block;background:#064e3b;color:#ffffff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a>
  </p>`;
}

export function emailMuted(text: string): string {
  return `<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">${text}</p>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#475569;">${text}</p>`;
}

export function emailCodeBlock(code: string): string {
  return `<p style="margin:24px 0;font-size:32px;font-weight:700;letter-spacing:0.28em;text-align:center;color:#064e3b;">${code}</p>`;
}
