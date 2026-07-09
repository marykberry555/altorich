import { z } from "zod";
import { NextResponse } from "next/server";
import { COMPANY } from "@/lib/company";
import { isValidMathChallenge } from "@/lib/math-challenge";
import { sendAuthEmail } from "@/services/auth/email.service";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(5000),
  mathA: z.number().int(),
  mathB: z.number().int(),
  mathAnswer: z.number().int()
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
    }

    const { name, email, subject, message, mathA, mathB, mathAnswer } = parsed.data;
    if (!isValidMathChallenge(mathA, mathB, mathAnswer)) {
      return NextResponse.json({ error: "Incorrect answer." }, { status: 400 });
    }

    const html = `
      <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p style="white-space:pre-wrap">${message}</p>
    `;

    const sent = await sendAuthEmail({
      to: COMPANY.supportEmail,
      subject: `[Contact] ${subject}`,
      html
    });

    if (!sent) {
      logger.warn("Contact form email failed", { email, subject });
      return NextResponse.json({ error: "Could not send message. Try again later." }, { status: 503 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Contact form error", {
      message: err instanceof Error ? err.message : String(err)
    });
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
