import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";

export async function GET() {
  const session = await getSessionOrThrow();
  return NextResponse.json(session);
}
