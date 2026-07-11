import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Webhook endpoint inactive." }, { status: 410 });
}
