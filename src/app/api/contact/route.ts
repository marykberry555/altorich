import { z } from "zod";
import { NextResponse } from "next/server";
import { COMPANY } from "@/lib/company";
import { isValidMathChallenge } from "@/lib/math-challenge";
import {
  contactAcknowledgementEmailHtml,
  contactInboxEmailHtml,
  sendAuthEmail
} from "@/services/auth/email.service";
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

    const inboxSent = await sendAuthEmail({
      to: COMPANY.supportEmail,
      subject: `[Contact] ${subject}`,
      html: contactInboxEmailHtml({ name, email, subject, message }),
      replyTo: email
    });

    if (!inboxSent) {
      logger.warn("Contact form inbox email failed", { email, subject });
      return NextResponse.json({ error: "Could not send message. Try again later." }, { status: 503 });
    }

    const ackSent = await sendAuthEmail({
      to: email,
      subject: "We received your message — AltoRich",
      html: contactAcknowledgementEmailHtml({ name, subject })
    });

    if (!ackSent) {
      logger.warn("Contact form acknowledgement email failed", { email, subject });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Contact form error", {
      message: err instanceof Error ? err.message : String(err)
    });
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
