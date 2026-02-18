import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFrameworkSession } from "@/lib/framework-api";

export async function GET() {
  const { session } = await getFrameworkSession(false);
  const rows = await prisma.pipelineStage.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { order: "asc" },
    include: { gates: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const { session, framework } = await getFrameworkSession(true);
    const b = await req.json();
    const row = await prisma.pipelineStage.create({
      data: {
        tenantId: session.tenantId,
        frameworkId: framework!.id,
        key: b.key,
        name: b.name,
        order: b.order ?? 0,
        isTerminal: !!b.isTerminal,
        colorToken: b.colorToken ?? null,
      },
    });
    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
}

export async function PUT(req: Request) {
  try {
    const { session } = await getFrameworkSession(true);
    const b = await req.json();
    if (Array.isArray(b.reorder)) {
      await Promise.all(
        b.reorder.map((x: any, idx: number) =>
          prisma.pipelineStage.updateMany({ where: { id: x.id, tenantId: session.tenantId }, data: { order: x.order ?? idx } })
        )
      );
      return NextResponse.json({ ok: true });
    }

    await prisma.pipelineStage.updateMany({
      where: { id: b.id, tenantId: session.tenantId },
      data: { key: b.key, name: b.name, order: b.order, isTerminal: b.isTerminal, colorToken: b.colorToken ?? null },
    });
    const row = await prisma.pipelineStage.findFirst({ where: { id: b.id, tenantId: session.tenantId } });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { session } = await getFrameworkSession(true);
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
    await prisma.pipelineStage.deleteMany({ where: { id, tenantId: session.tenantId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
}
