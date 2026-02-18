# Sales Agenda (Next.js + Prisma multi-tenant)

## Requisitos
- Node 18+
- PostgreSQL

## Variables de entorno
Copia `.env.example` a `.env` y completa:
- `DATABASE_URL`
- `DIRECT_URL` (opcional)
- `JWT_SECRET`
- `COOKIE_NAME`
- `NEXT_PUBLIC_APP_URL`

## Setup local
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

## Migraciones
- Local: `npx prisma migrate dev`
- Producción: `npm run db:migrate:deploy` (equivale a `prisma migrate deploy`)

## Build
```bash
npm run build
```

## Deploy en Vercel (paso a paso)
1. Subir repo a GitHub.
2. Importar proyecto en Vercel.
3. Configurar env vars (`DATABASE_URL`, `DIRECT_URL` opcional, `JWT_SECRET`, `COOKIE_NAME`, `NEXT_PUBLIC_APP_URL`, `BLOB_READ_WRITE_TOKEN`).
4. Build Command: `npm run build`.
5. Antes de arrancar la app en producción, ejecutar migraciones:
   - En CI o manual: `npm run db:migrate:deploy`
6. (Opcional) cargar seed solo en entornos no productivos:
   - `npm run db:seed`

## Reglas de negocio vigentes
- Multi-tenant: filtrar siempre por `tenantId`.
- Roles válidos: `OWNER`, `ADMIN`, `REGIONAL_MANAGER`, `MANAGER`, `AGENT`, `SECRETARY`.
- Solo ventas `CLOSED` cuentan para ganancias.
- `SECRETARY` no ve métricas monetarias.
