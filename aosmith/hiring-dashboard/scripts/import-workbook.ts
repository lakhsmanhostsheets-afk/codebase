/**
 * Import an Excel workbook directly into Postgres (no Vercel upload limit).
 *
 * Full import:
 *   npm run db:import -- "../Copy of Copy of AO Smith Hiring.xlsx"
 *
 * Lineups only (after open list already loaded):
 *   npm run db:import -- --lineups-only "../Copy of Copy of AO Smith Hiring.xlsx"
 */
import { readFileSync, existsSync } from "fs";
import { basename, resolve } from "path";
import { importLineupsOnly, importWorkbook } from "@/lib/domain/excel-import";
import { prisma } from "@/lib/prisma";

async function main() {
  const lineupsOnly = process.argv.includes("--lineups-only");
  const fileArg = process.argv.find((arg) => /\.xlsx?$/i.test(arg));

  if (!fileArg) {
    console.error(
      "Usage: npm run db:import -- [--lineups-only] <path-to-workbook.xlsx>",
    );
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
    `${lineupsOnly ? "Lineups-only" : "Full"} import: ${sourceFileName} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)…`,
  );
  console.log("This may take several minutes for large workbooks…");

  const result = lineupsOnly
    ? await importLineupsOnly(buffer, sourceFileName)
    : await importWorkbook(buffer, sourceFileName);

  console.log(`Done: ${result.rowsImported}/${result.rowsRead} rows saved.`);
  if (result.errors.length > 0) {
    console.log(`${result.errors.length} warnings. First 15:`);
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
