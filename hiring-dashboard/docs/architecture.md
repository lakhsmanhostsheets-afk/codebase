# Hiring Dashboard Architecture

## Deployment

- Frontend and API routes run in a single Next.js deployment on Vercel.
- PostgreSQL, Auth, and file object storage are provided by Supabase.

## Runtime Flow

1. Admin logs in via environment-based credentials (single admin for v1).
2. User uploads Excel workbook through `/api/imports`.
3. Import service parses sheets and upserts canonical records.
4. Dashboard calls `/api/dashboard/summary` with active filters.
5. UI renders KPI cards, charts, and state table widgets.
6. Exports call `/api/exports/excel` and `/api/exports/pdf`.

## Components

- `app/page.tsx`: dashboard shell + filters + builder + exports.
- `lib/domain/excel-import.ts`: workbook ingestion logic.
- `lib/domain/hiring-metrics.ts`: summary metrics and state breakdown.
- `app/api/*`: import, dashboard, export, and saved dashboard endpoints.
- `prisma/schema.prisma`: canonical data model.
