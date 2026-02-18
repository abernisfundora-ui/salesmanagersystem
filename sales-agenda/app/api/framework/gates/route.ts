import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFrameworkSession } from "@/lib/framework-api";

export async function GET(req: Request) {
  const { session } = await getFrameworkSession(false);
  const stageId = new URL(req.url).searchParams.get("stageId") || undefined;
  return NextResponse.json(await prisma.stageGate.findMany({ where: { tenantId: session.tenantId, ...(stageId ? { stageId } : {}) }, orderBy: { order: "asc" } }));
}

export async function POST(req: Request) {
  try {
    const { session } = await getFrameworkSession(true);
    const b = await req.json();
    return NextResponse.json(await prisma.stageGate.create({ data: { tenantId: session.tenantId, stageId: b.stageId, order: b.order ?? 0, ruleJson: b.ruleJson, message: b.message } }), { status: 201 });
  } catch { return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); }
}

export async function PUT(req: Request) {
  try {
    const { session } = await getFrameworkSession(true);
    const b = await req.json();
    await prisma.stageGate.updateMany({ where: { id: b.id, tenantId: session.tenantId }, data: { order: b.order, ruleJson: b.ruleJson, message: b.message } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); }
}

export async function DELETE(req: Request) {
  try {
    const { session } = await getFrameworkSession(true);
    const id = new URL(req.url).searchParams.get("id");
    await prisma.stageGate.deleteMany({ where: { id: id || "", tenantId: session.tenantId } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); }
}
