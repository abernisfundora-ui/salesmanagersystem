import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFrameworkSession } from "@/lib/framework-api";

export async function GET() {
  const { session, framework } = await getFrameworkSession(false);
  if (!framework) return NextResponse.json({ framework: null, tenantId: session.tenantId });
  return NextResponse.json(framework);
}

export async function PUT(req: Request) {
  try {
    const { session, framework } = await getFrameworkSession(true);
    const body = await req.json();
    const updated = await prisma.rubkleyFramework.upsert({
      where: { id: framework!.id },
      update: { name: body.name ?? framework!.name, version: body.version ?? framework!.version, isActive: body.isActive ?? true },
      create: { tenantId: session.tenantId, name: body.name ?? "Rubkley Framework", version: body.version ?? "v1", isActive: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
}
