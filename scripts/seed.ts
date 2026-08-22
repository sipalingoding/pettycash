import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { transactions, type NewTransaction } from "../src/db/schema";
import raw from "./seed-data.json";

type RawRow = {
  no: number;
  d: string;
  k: string;
  in: number;
  out: number;
  s: number;
  c: string;
};

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string."
    );
  }

  const client = neon(process.env.DATABASE_URL);
  const db = drizzle(client);

  const rows = raw as RawRow[];
  console.log(`Seeding ${rows.length} transactions from the real 2025 ledger…`);

  const existing = await db.select({ count: sql<number>`count(*)` }).from(transactions);
  const existingCount = Number(existing[0]?.count ?? 0);
  if (existingCount > 0) {
    console.log(
      `Table already has ${existingCount} rows. Skipping seed (this script only seeds an empty table).`
    );
    console.log("To re-seed from scratch, truncate the table first:");
    console.log("  TRUNCATE TABLE transactions RESTART IDENTITY;");
    return;
  }

  const values: NewTransaction[] = rows.map((r) => ({
    txNo: r.no,
    date: r.d,
    description: r.k,
    category: r.c,
    amountIn: r.in,
    amountOut: r.out,
    balance: r.s,
    attachmentUrl: null,
  }));

  const BATCH_SIZE = 200;
  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const batch = values.slice(i, i + BATCH_SIZE);
    await db.insert(transactions).values(batch);
    console.log(`  inserted ${Math.min(i + BATCH_SIZE, values.length)}/${values.length}`);
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
