import { createHmac, timingSafeEqual } from "crypto";
import { getServerEnv } from "@/lib/env";

const PAYSTACK_BASE = "https://api.paystack.co";

export type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: "success" | "failed" | "abandoned" | "pending";
    reference: string;
    amount: number;
    currency: string;
    paid_at: string | null;
    gateway_response: string;
    metadata?: Record<string, unknown>;
  };
};

export function getPaystackSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }
  return key;
}

export function getPaystackPublicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
}

export function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY);
}

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const secret = getPaystackSecretKey();
  const response = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const body = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    const message = (body as { message?: string }).message ?? `Paystack HTTP ${response.status}`;
    throw new Error(message);
  }

  return body;
}

export async function paystackInitialize(input: {
  email: string;
  amount: number;
  reference: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
}) {
  return paystackRequest<PaystackInitializeResponse>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amount * 100),
      reference: input.reference,
      currency: "NGN",
      metadata: input.metadata ?? {},
      callback_url: input.callbackUrl
    })
  });
}

export async function paystackVerify(reference: string) {
  return paystackRequest<PaystackVerifyResponse>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function verifyPaystackWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  const secret = getPaystackSecretKey();
  const hash = createHmac("sha512", secret).update(rawBody).digest("hex");

  try {
    const a = Buffer.from(hash);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function parsePaystackWebhook(rawBody: string): {
  event: string;
  data: Record<string, unknown>;
} {
  const parsed = JSON.parse(rawBody) as { event: string; data: Record<string, unknown> };
  return parsed;
}

export function paystackEventId(payload: { event: string; data: Record<string, unknown> }): string {
  const data = payload.data;
  const id = data.id ?? data.reference ?? data.transaction_reference;
  return `${payload.event}:${String(id)}`;
}
