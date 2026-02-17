import { getSessionOrThrow } from "@/lib/auth";
import { canConfigureFramework } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function getFrameworkSession(requireConfig = false) {
  const session = await getSessionOrThrow();
  if (requireConfig && !canConfigureFramework(session.role)) throw new Error("FORBIDDEN");
  let framework = await prisma.rubkleyFramework.findFirst({ where: { tenantId: session.tenantId, isActive: true } });
  if (!framework && requireConfig) {
    framework = await prisma.rubkleyFramework.create({ data: { tenantId: session.tenantId, name: "Rubkley Framework", version: "v1", isActive: true } });
  }
  return { session, framework };
}
