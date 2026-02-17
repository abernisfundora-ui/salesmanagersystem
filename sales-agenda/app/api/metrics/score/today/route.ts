import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { computeDailyScore } from "@/lib/rubkley";

export async function GET() {
  const session = await getSessionOrThrow();
  const result = await computeDailyScore(session.tenantId, session.userId, session.role);
  if (session.role === "SECRETARY") {
    return NextResponse.json({ score: result.activityScore, activityScore: result.activityScore, financialScore: null });
  }
  return NextResponse.json(result);
}
