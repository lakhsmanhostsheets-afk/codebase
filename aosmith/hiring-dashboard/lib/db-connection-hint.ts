export function formatDatabaseError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes("invalid port number") ||
    message.includes("Error parsing connection string") ||
    message.includes("database string is invalid")
  ) {
    return [
      "Database connection failed: DATABASE_URL in Vercel is invalid.",
      "Common fixes:",
      "1) Supabase → Connect → ORM → copy the full URI (Transaction pooler, port 6543).",
      "2) Replace [YOUR-PASSWORD] with your real DB password.",
      "3) If the password has @ # % & etc., URL-encode it (e.g. @ → %40).",
      "4) Or reset Supabase DB password to letters+numbers only, then update Vercel and redeploy.",
    ].join(" ");
  }

  if (message.includes("Can't reach database") || message.includes("P1001")) {
    return "Cannot reach the database. Check DATABASE_URL and that Supabase project is running.";
  }

  if (message.includes("Authentication failed") || message.includes("P1000")) {
    return "Database login failed. Check the password in DATABASE_URL on Vercel.";
  }

  return message;
}
