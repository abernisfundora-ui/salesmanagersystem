import { PrismaClient, Role, ContactStatus, AppointmentStatus, SaleStatus, GoalPeriod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function cents(n: number) { return Math.round(n * 100); }
function atUTCDatePlus(days: number, hour = 15, minute = 0) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days, hour, minute, 0));
}
function dayBucket() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), 0, 0, 0));
}

async function main() {
  await prisma.recommendationEvent.deleteMany();
  await prisma.recommendationRule.deleteMany();
  await prisma.trophyAward.deleteMany();
  await prisma.trophyDefinition.deleteMany();
  await prisma.goalProgress.deleteMany();
  await prisma.goalDefinition.deleteMany();
  await prisma.kpiMetricDefinition.deleteMany();
  await prisma.kpiSet.deleteMany();
  await prisma.playDefinition.deleteMany();
  await prisma.playbook.deleteMany();
  await prisma.stageGate.deleteMany();
  await prisma.contactStageHistory.deleteMany();
  await prisma.contact.updateMany({ data: { stageId: null } });
  await prisma.pipelineStage.deleteMany();
  await prisma.rubkleyFramework.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.task.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany();

  const tenant = await prisma.tenant.create({ data: { name: "Demo Company", slug: "demo-company-" + Math.random().toString(16).slice(2, 6), plan: "pro" } });
  const passwordHash = await bcrypt.hash("123456", 10);

  const regional = await prisma.user.create({ data: { name: "Regional Demo", email: "regional@demo.com", passwordHash } });
  const manager1 = await prisma.user.create({ data: { name: "Manager Norte", email: "manager1@demo.com", passwordHash } });
  const manager2 = await prisma.user.create({ data: { name: "Manager Sur", email: "manager2@demo.com", passwordHash } });
  const agent1 = await prisma.user.create({ data: { name: "Agente Raul", email: "raul@demo.com", passwordHash } });
  const agent2 = await prisma.user.create({ data: { name: "Agente Ana", email: "ana@demo.com", passwordHash } });
  const secretary = await prisma.user.create({ data: { name: "Secretaria Mia", email: "secretary@demo.com", passwordHash } });

  await prisma.membership.createMany({ data: [
    { tenantId: tenant.id, userId: regional.id, role: Role.REGIONAL_MANAGER, status: "ACTIVE" },
    { tenantId: tenant.id, userId: manager1.id, role: Role.MANAGER, status: "ACTIVE", reportsToUserId: regional.id },
    { tenantId: tenant.id, userId: manager2.id, role: Role.MANAGER, status: "ACTIVE", reportsToUserId: regional.id },
    { tenantId: tenant.id, userId: agent1.id, role: Role.AGENT, status: "ACTIVE", reportsToUserId: manager1.id },
    { tenantId: tenant.id, userId: agent2.id, role: Role.AGENT, status: "ACTIVE", reportsToUserId: manager2.id },
    { tenantId: tenant.id, userId: secretary.id, role: Role.SECRETARY, status: "ACTIVE", reportsToUserId: manager1.id },
  ] });

  const framework = await prisma.rubkleyFramework.create({ data: { tenantId: tenant.id, name: "Rubkley Framework", version: "v1", isActive: true } });
  const stageData = [
    ["NEW","New",0,false],["CONTACTED","Contacted",1,false],["QUALIFIED","Qualified",2,false],["APPOINTMENT_SET","Appointment Set",3,false],
    ["APPOINTMENT_DONE","Appointment Done",4,false],["PROPOSAL","Proposal",5,false],["CLOSED_WON","Closed Won",6,true],["CLOSED_LOST","Closed Lost",7,true]
  ] as const;
  const stages: any[] = [];
  for (const s of stageData) stages.push(await prisma.pipelineStage.create({ data: { tenantId: tenant.id, frameworkId: framework.id, key: s[0], name: s[1], order: s[2], isTerminal: s[3], colorToken: s[0].includes("CLOSED") ? "green" : "purple" } }));
  const byKey = Object.fromEntries(stages.map((s) => [s.key, s]));

  await prisma.stageGate.createMany({ data: [
    { tenantId: tenant.id, stageId: byKey.CONTACTED.id, order: 1, ruleJson: { type: "hasContactMethod", value: true }, message: "Debe existir teléfono o email" },
    { tenantId: tenant.id, stageId: byKey.APPOINTMENT_SET.id, order: 1, ruleJson: { type: "hasAppointment", value: true }, message: "Se requiere cita agendada" },
    { tenantId: tenant.id, stageId: byKey.CLOSED_WON.id, order: 1, ruleJson: { type: "saleClosed", value: true }, message: "Debe existir venta CLOSED" },
  ] });

  const pbRoles: Role[] = ["AGENT", "MANAGER", "SECRETARY", "REGIONAL_MANAGER"] as any;
  for (const role of pbRoles) {
    const pb = await prisma.playbook.create({ data: { tenantId: tenant.id, frameworkId: framework.id, role, name: `${role} Core Plays`, isActive: true } });
    for (let i=1;i<=5;i++) {
      await prisma.playDefinition.create({ data: { tenantId: tenant.id, playbookId: pb.id, stageId: i<=3 ? stages[i-1].id : null, order: i, name: `${role} Play ${i}`, intent: "Estandarizar ejecución", checklistJson: ["Paso 1", "Paso 2"], templatesJson: { sms: "Hola {{name}}" } } });
    }
  }

  const setAgent = await prisma.kpiSet.create({ data: { tenantId: tenant.id, frameworkId: framework.id, role: "AGENT", name: "Agent KPI Set", isActive: true } });
  const setManager = await prisma.kpiSet.create({ data: { tenantId: tenant.id, frameworkId: framework.id, role: "MANAGER", name: "Manager KPI Set", isActive: true } });
  const setRegional = await prisma.kpiSet.create({ data: { tenantId: tenant.id, frameworkId: framework.id, role: "REGIONAL_MANAGER", name: "Regional KPI Set", isActive: true } });
  const setSecretary = await prisma.kpiSet.create({ data: { tenantId: tenant.id, frameworkId: framework.id, role: "SECRETARY", name: "Secretary KPI Set", isActive: true } });
  const agentMetrics = [["S","Sesiones","count",2],["Z","Cierres","count",3],["CC","Contactos","count",2],["C","Conversion","pct",2],["X","No cierre","count",1]] as const;
  for (const m of agentMetrics) await prisma.kpiMetricDefinition.create({ data: { tenantId: tenant.id, kpiSetId: setAgent.id, key: m[0], name: m[1], unit: m[2], weight: m[3], defaultTarget: 5 } });
  for (const [setId, role] of [[setManager.id,"MANAGER"],[setRegional.id,"REGIONAL_MANAGER"],[setSecretary.id,"SECRETARY"]] as const) {
    await prisma.kpiMetricDefinition.createMany({ data: [
      { tenantId: tenant.id, kpiSetId: setId, key: "ACT", name: `${role} Activity`, unit: "count", weight: 2, defaultTarget: 10 },
      { tenantId: tenant.id, kpiSetId: setId, key: "QLT", name: `${role} Quality`, unit: "score", weight: 1.5, defaultTarget: 8 },
    ] });
  }

  const roles: Role[] = ["AGENT","MANAGER","REGIONAL_MANAGER","SECRETARY"] as any;
  for (const role of roles) {
    for (const period of [GoalPeriod.DAILY, GoalPeriod.WEEKLY, GoalPeriod.MONTHLY]) {
      await prisma.goalDefinition.create({ data: { tenantId: tenant.id, frameworkId: framework.id, role, period, metricKey: role === "AGENT" ? "CC" : "ACT", targetValue: period === GoalPeriod.DAILY ? 5 : period === GoalPeriod.WEEKLY ? 25 : 100, isActive: true } });
    }
  }

  for (let i=1;i<=10;i++) {
    await prisma.trophyDefinition.create({ data: { tenantId: tenant.id, frameworkId: framework.id, name: `Trophy ${i}`, description: `Regla ${i}`, icon: "🏆", ruleJson: { type: i%2 ? "streakCC" : "streakClosed", gte: i }, isActive: true } });
  }
  for (let i=1;i<=10;i++) {
    await prisma.recommendationRule.create({ data: { tenantId: tenant.id, frameworkId: framework.id, role: i%2 ? "AGENT" : "MANAGER", priority: i, conditionJson: { type: i%3===0 ? "closedSalesEq" : "pendingTasksGte", value: i%3===0 ? 0 : 1 }, actionJson: { text: `Regla ${i}`, createTask: { title: `Acción recomendada ${i}` } }, isActive: true } });
  }

  await prisma.contact.createMany({ data: [
    { tenantId: tenant.id, createdById: secretary.id, assignedAgentId: agent1.id, stageId: byKey.NEW.id, name: "Juan Perez", phone: "+1 555 100 200", email: "juan@correo.com", company: "JP Holdings", status: ContactStatus.NEW },
    { tenantId: tenant.id, createdById: secretary.id, assignedAgentId: agent1.id, stageId: byKey.APPOINTMENT_SET.id, name: "Maria Lopez", phone: "+1 555 300 400", email: "maria@correo.com", company: "Lopez LLC", status: ContactStatus.IN_PROGRESS },
    { tenantId: tenant.id, createdById: manager1.id, assignedAgentId: agent2.id, stageId: byKey.PROPOSAL.id, name: "Carlos Diaz", phone: "+1 555 777 111", email: "carlos@correo.com", company: "Diaz Group", status: ContactStatus.QUALIFIED },
    { tenantId: tenant.id, createdById: manager1.id, assignedAgentId: agent2.id, stageId: byKey.CLOSED_WON.id, name: "Sofia Martinez", phone: "+1 555 888 222", email: "sofia@correo.com", company: "Martinez Inc", status: ContactStatus.CLOSED },
  ] });

  const [c1,c2,c3,c4] = await prisma.contact.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: "asc" } });
  await prisma.appointment.createMany({ data: [
    { tenantId: tenant.id, contactId: c1.id, agentId: agent1.id, createdById: secretary.id, startsAt: atUTCDatePlus(0, 16, 0), endsAt: atUTCDatePlus(0, 17, 0), notes: "Primera llamada", status: AppointmentStatus.SCHEDULED },
    { tenantId: tenant.id, contactId: c2.id, agentId: agent1.id, createdById: secretary.id, startsAt: atUTCDatePlus(1, 16, 0), endsAt: atUTCDatePlus(1, 17, 0), notes: "Seguimiento", status: AppointmentStatus.SCHEDULED },
  ] });
  await prisma.sale.createMany({ data: [
    { tenantId: tenant.id, contactId: c2.id, agentId: agent1.id, createdById: manager1.id, status: SaleStatus.FUTURE, profitCents: cents(300), saleDate: atUTCDatePlus(2, 18, 0), title: "Venta esperada", currency: "USD" },
    { tenantId: tenant.id, contactId: c4.id, agentId: agent2.id, createdById: manager2.id, status: SaleStatus.CLOSED, profitCents: cents(700), saleDate: atUTCDatePlus(-1, 19, 0), title: "Venta cerrada", currency: "USD" },
  ] });

  await prisma.goalProgress.createMany({ data: [
    { tenantId: tenant.id, userId: agent1.id, dateBucket: dayBucket(), period: GoalPeriod.DAILY, metricKey: "CC", targetValue: 5, actualValue: 3, status: "AT_RISK" },
    { tenantId: tenant.id, userId: agent2.id, dateBucket: dayBucket(), period: GoalPeriod.DAILY, metricKey: "CC", targetValue: 5, actualValue: 6, status: "ACHIEVED" },
  ] });

  console.log("✅ Seed Rubkley completado");
}

main().catch((e) => {
  console.error("❌ Seed error:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
