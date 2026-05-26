/**
 * Import an Excel workbook directly into Postgres (no Vercel upload limit).
 *
 * Usage:
 *   npm run db:import -- "../Copy of Copy of AO Smith Hiring.xlsx"
 *
 * Uses DATABASE_URL from .env — set this to your Supabase connection string
 * (port 5432 direct URL is best for bulk import).
 */
import { readFileSync, existsSync } from "fs";
import { basename, resolve } from "path";
import { importWorkbook } from "@/lib/domain/excel-import";
import { prisma } from "@/lib/prisma";

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error("Usage: npm run db:import -- <path-to-workbook.xlsx>");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing. Add it to hiring-dashboard/.env");
    process.exit(1);
  }

  const filePath = resolve(fileArg);
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const buffer = readFileSync(filePath);
  const sourceFileName = basename(filePath);

  console.log(
    `Importing ${sourceFileName} (${(buffer.length / 1024 / 1024).toFixed(2)} MB) into database…`,
  );

  const result = await importWorkbook(buffer, sourceFileName);

  console.log(`Done: ${result.rowsImported}/${result.rowsRead} rows saved.`);
  if (result.errors.length > 0) {
    console.log(`${result.errors.length} lineup rows skipped (store not found). First 15:`);
    for (const err of result.errors.slice(0, 15)) {
      console.log(`  - ${err}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
