import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Payment verification is handled manually after bank transfer funding." },
    { status: 410 }
  );
}
