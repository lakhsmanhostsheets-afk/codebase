# Hiring Dashboard

Hiring operations dashboard that migrates Excel-driven store and candidate tracking to a web app with import, analytics, filters, and export.

## Stack

- Next.js App Router + TypeScript
- Tailwind + shadcn/ui
- Prisma ORM + PostgreSQL (Supabase recommended)
- Recharts + react-grid-layout dashboard builder
- Excel/PDF export APIs

## Required Accounts

- Vercel (deployment)
- Supabase (Postgres, Auth, Storage)

## Environment

Copy `.env.example` to `.env` and fill values.

### DATABASE_URL (Supabase) — common errors

Use **Supabase → Connect → ORM → URI** (Transaction pooler, port `6543`).

Example shape:

```txt
postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
```

If you see **invalid port number**:

- Password still contains `[YOUR-PASSWORD]` placeholder
- Password has special characters (`@`, `#`, `%`) — **URL-encode** them (`@` → `%40`)
- Extra spaces or quotes around the value in Vercel
- Easiest fix: **reset DB password** in Supabase to letters+numbers only, paste into Vercel `DATABASE_URL`, redeploy

## Local Development

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

## Data Model

Canonical tables:

- `Store`
- `OpenPosition`
- `Candidate`
- `Lineup`
- `ImportJob`
- `Dashboard`
- `DashboardWidget`

See `prisma/schema.prisma`.

## Import Mapping (Excel parity)

Workbook assumptions:

- `AO Smith Open list` (or `Open List`)
- `Line Up Final`

Mappings:

- Open list -> `Store` + `OpenPosition`
- Line Up Final -> `Candidate` + `Lineup`
- Status values mapped to enum tags:
  - `Interview Pending`
  - `Rejected`
  - `Final Selection`
  - `Client Selected`
  - `Back Out`
  - `On Hold`

## API Contracts

- `POST /api/imports` (multipart form-data with `file`)
- `GET /api/dashboard/summary?state=&city=&supervisor=&accountName=&fromDate=&toDate=`
- `GET /api/exports/excel?...filters`
- `GET /api/exports/pdf?...filters`
