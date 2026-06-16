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

## Bulk import (recommended for large Excel files)

Vercel blocks request bodies over ~4.5MB. For workbooks like your 8MB AO Smith file, **import from your PC straight into Supabase** (no upload to Vercel):

1. In Supabase → **Connect** → copy the **direct** Postgres URI (port `5432`, not the pooler).
2. Paste it as `DATABASE_URL` in `hiring-dashboard/.env` (same database as production).
3. Create tables if needed: `npm run db:push`
4. Run:

```bash
cd hiring-dashboard
npm run db:import -- "../Copy of Copy of AO Smith Hiring.xlsx"
```

Data appears on the live site immediately (same database). Re-run only if you intend to duplicate rows.

**Web import:** After deploy, the Import page should show **“Import UI v2 — batched API”**. If you still see “Files over 4MB… parsing happens locally”, hard-refresh or you are on an old deployment.

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

- `POST /api/imports` (JSON batches: `{ mode: "open"|"lineup", rows, rowOffset, sourceFileName }`)
- `GET /api/dashboard/summary?state=&city=&supervisor=&accountName=&fromDate=&toDate=`
- `GET /api/exports/excel?...filters`
- `GET /api/exports/pdf?...filters`

## Task Tracker (POC)

Isolated module at **`/tasks`** — separate auth, tables (`Ops*`), and session from the hiring dashboard.

### Task tracker env vars

Add to `.env` and Vercel:

```txt
TASKS_ADMIN_EMAIL=admin@yourcompany.com
TASKS_ADMIN_PASSWORD=your-secure-password
TASKS_SESSION_SECRET=random-string-at-least-32-chars
```

On first login at `/tasks/login`, the bootstrap admin is created from `TASKS_ADMIN_EMAIL` / `TASKS_ADMIN_PASSWORD` if no admin exists yet. Then create team users under **Admin → Users**.

### Task tracker routes

- `/tasks/login` — team sign-in
- `/tasks` — my tasks (assigned, created, or tagged)
- `/tasks/new` — create task
- `/tasks/admin` — all tasks grouped by person (admin)
- `/tasks/admin/analytics` — per-user completed vs pending pie charts
- `/tasks/admin/users` — create/deactivate users
- `/tasks/admin/fields` — custom fields (e.g. Client Name)

After schema changes: `npm run db:push` (adds `Ops*` tables only; hiring tables unchanged).
