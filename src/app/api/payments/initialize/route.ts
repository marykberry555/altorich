import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Online card payments are not available. Fund your wallet via bank transfer." },
    { status: 410 }
  );
}
