# AUDIT.md — Auditoría completa del workspace/ZIP

Fecha: 2026-02-17  
Workspace: `/workspace/salesmanagersystem`

## A) Inventario del contenido (comandos + output)

### 1) `ls -la` (workspace root)
```bash
cd /workspace/salesmanagersystem && ls -la
```
Salida:
- `.git/`
- `sales-agenda/` (app real)
- `AUDIT.md`
- `DOWNLOAD_INSTRUCTIONS.md`
- `sales-agenda.zip` (artefacto viejo en repo)

### 2) `tree -L 4` fallback a `find`
```bash
cd /workspace/salesmanagersystem && (tree -L 4 || find . -maxdepth 4 -type f | sort)
```
`tree` no está instalado, se usó `find`.

### 3) Localización de `package.json`
```bash
cd /workspace/salesmanagersystem && find . -name package.json -type f | sort
```
Resultado:
- `./sales-agenda/package.json`

## Root real de la app
El root real del proyecto Next.js es **`/workspace/salesmanagersystem/sales-agenda`**.

---

## B) Verificación de stack y scripts

## Stack confirmado
- **Next.js 14.2.5** con **App Router** (carpeta `app/`, no existe `pages/`).
- **TypeScript** (`tsconfig.json`, `next-env.d.ts`).
- **Tailwind CSS** (`tailwind.config.ts`, `postcss.config.js`).
- **Auth JWT propio** (`lib/jwt.ts`, `lib/auth.ts`; no NextAuth).
- **Prisma + PostgreSQL** (`prisma/schema.prisma`, migraciones versionadas).
- **Framer Motion** y **Vercel Blob** en dependencias.

## Scripts (package.json)
- `dev`: `next dev`
- `build`: `prisma generate && next build`
- `db:migrate:deploy`: `prisma migrate deploy`
- `db:seed`: `prisma db seed`
- `postinstall`: `prisma generate`

---

## C) Auditoría Prisma y base de datos

## Schema + migraciones + seed
- Schema: `sales-agenda/prisma/schema.prisma`
- Migraciones:
  - `202602170001_initial`
  - `202602170002_rubkley_framework`
  - `migration_lock.toml`
- Seed: `sales-agenda/prisma/seed.ts` (demo multi-tenant + Rubkley)

## Multi-tenant (tenantId + índices)
Tablas sensibles tienen `tenantId` y en su mayoría índices compuestos por tenant:
- Core: `Membership`, `Contact`, `Appointment`, `Sale`, `Task`, `Reminder`
- Rubkley: `RubkleyFramework`, `PipelineStage`, `StageGate`, `Playbook`, `PlayDefinition`, `KpiSet`, `KpiMetricDefinition`, `GoalDefinition`, `GoalProgress`, `TrophyDefinition`, `TrophyAward`, `RecommendationRule`, `RecommendationEvent`, `ContactStageHistory`

## Reglas de negocio verificadas
1. **Roles válidos**: `OWNER, ADMIN, REGIONAL_MANAGER, MANAGER, AGENT, SECRETARY` (sin legacy).
2. **Jerarquía**: `Membership.reportsToUserId` + validación en `/api/team`.
3. **SECRETARY no ve ganancias**:
   - `/api/metrics/summary`: `profitMonthCents/profitTodayCents = null` para SECRETARY.
   - `/api/metrics/score/today`: `financialScore = null` para SECRETARY.
   - `/api/contacts/[id]`: ventas con `profitCents: null` para SECRETARY.
4. **Solo CLOSED cuenta en métricas monetarias**:
   - Summary y agregaciones de profit filtran `status: "CLOSED"`.
   - Calendario de ventas usa `status = 'CLOSED'`.
5. **SECRETARY no puede avanzar stage**:
   - `/api/contacts/[id]/stage/advance` bloquea por permiso.

---

## D) Matriz de permisos por rol (pantallas + endpoints)

| Rol | Pantallas típicas | Endpoints clave | Finanzas |
|---|---|---|---|
| OWNER | Dashboard completo + regional/framework/followup | team, framework CRUD, metrics, sales, contacts | ✅ |
| ADMIN | Similar OWNER | team, framework CRUD, metrics, sales, contacts | ✅ |
| REGIONAL_MANAGER | `/dashboard/regional`, `/dashboard/framework` | team, framework CRUD, metrics, recommendations | ✅ |
| MANAGER | `/dashboard/framework`, `/dashboard/followup`, calendar KPI | team (gestión), tasks, recommendations | ✅ |
| AGENT | `/dashboard/agent`, contacts/calendario asignados | recommendations today/track, metrics scope agent | ✅ (según endpoints actuales) |
| SECRETARY | `/dashboard/secretary`, contacts/calendario | contactos/citas/followup preview según permisos | ❌ (null/oculto) |

### Violaciones o puntos frágiles detectados
- No se detectó endpoint obvio que entregue `profitCents` a SECRETARY en los endpoints auditados de métricas/contact detail.
- **Riesgo**: no hay suite de tests automatizados de autorización/tenant leakage.
- **Riesgo**: varias páginas hacen guardas por redirección client-side; faltan guardas server-side homogéneas en todas las rutas UI.

---

## E) Estado por módulos

| Módulo | Estado | Nota |
|---|---|---|
| Auth JWT + selección tenant | Implementado | login/register/select-tenant + middleware |
| Multi-tenant | Parcial-alto | patrón tenantId amplio; falta test automation |
| Roles/hierarquía | Implementado | enum limpio + reportsToUserId validado |
| Contactos (foto) | Implementado | upload blob + photoUrl |
| Contactos (DOB/origen) | Falta | no modelado |
| Calendario (verde/morado) | Implementado | ventas CLOSED verde, citas morado |
| Ventas CLOSED en ganancias | Implementado | filtros CLOSED |
| KPI diario S,Z,CC,C,X | Implementado | endpoint + panel |
| Tareas/recordatorios | Implementado | task/reminder + APIs |
| Follow-up confirmación masiva | Implementado | generate/preview/confirm |
| Rubkley Framework | Parcial | base sólida, UX/admin y tests aún incompletos |
| Dashboards por rol | Parcial | existen, pero guardas server-side irregulares |
| Seguridad input | Parcial | zod en varios endpoints, no uniforme total |

### Top 10 riesgos (orden severidad)
1. Falta testing automático de permisos multi-tenant (alto).
2. Falta testing automático de SECRETARY/no-finance (alto).
3. Guardas de rol client-side en algunas páginas (alto).
4. APIs CRUD Rubkley con validación zod incompleta (medio-alto).
5. No existe TenantSettings para “ganancia fija configurable” (medio-alto).
6. Ausencia de contrato OpenAPI/esquemas compartidos (medio).
7. Uso de algunos `any` en rutas y UI (medio).
8. No hay lint/test pipeline documentado CI (medio).
9. Seed demo no cubre todos los casos borde de permisos (medio-bajo).
10. UX de builder Rubkley aún básica (medio-bajo).

---

## F) Checklist de ejecución (PC y Vercel)

## Env vars requeridas
Desde `.env.example`:
- `DATABASE_URL`
- `DIRECT_URL` (opcional)
- `JWT_SECRET`
- `COOKIE_NAME`
- `NEXT_PUBLIC_APP_URL`
- (para upload foto) `BLOB_READ_WRITE_TOKEN`

## Local (PC)
```bash
cd sales-agenda
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
npm run build
```

## Producción / Vercel
```bash
cd sales-agenda
npm install
npm run db:migrate:deploy
npm run build
```
Configurar env vars en Vercel Project Settings.

## Comandos ejecutados aquí (output resumido)
```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```
Resultado en este entorno: bloqueado por red/política npm (`403 Forbidden`) y `prisma: not found` al no poder instalar dependencias.

---

## G) Inventario funcional resumido

### Rutas UI (App Router)
- Auth/entry: `/`, `/login`, `/select-tenant`
- Dashboard: `/dashboard`, `/dashboard/contacts`, `/dashboard/contacts/[id]`, `/dashboard/calendar`, `/dashboard/agents`, `/dashboard/agent`, `/dashboard/followup`, `/dashboard/framework`, `/dashboard/regional`, `/dashboard/secretary`

### Rutas API
- Auth: `/api/auth/*`
- Team: `/api/team`, `/api/team/[userId]`
- CRM: `/api/contacts`, `/api/contacts/[id]`, `/api/appointments`, `/api/sales`, `/api/tasks`
- Pipeline: `/api/contacts/[id]/stage/advance`
- Métricas: `/api/metrics/summary`, `/api/metrics/agents`, `/api/metrics/agent-kpis`, `/api/metrics/score/today`
- Follow-up: `/api/followup/generate`, `/api/followup/preview`
- Rubkley config: `/api/framework`, `/api/framework/stages`, `/api/framework/gates`, `/api/framework/playbooks`, `/api/framework/kpisets`, `/api/framework/goals`, `/api/framework/trophies`, `/api/framework/recommendation-rules`
- Recommendations: `/api/recommendations/today`, `/api/recommendations/[id]/accept|dismiss|complete`
- Upload: `/api/uploads/contact-photo`
