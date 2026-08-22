import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Every page in this app is force-dynamic (see `(app)/layout.tsx`), so this module
// is only ever evaluated for real at request time — except during `next build`,
// which still imports route modules to collect their config. Don't throw eagerly
// here or the build breaks before a DATABASE_URL even exists; a placeholder lets
// `neon()` construct lazily and only fails once a query actually runs.
if (!process.env.DATABASE_URL) {
  console.warn(
    "[db] DATABASE_URL is not set — copy .env.example to .env.local. Queries will fail until it's configured."
  );
}

const sql = neon(
  process.env.DATABASE_URL ??
    "postgresql://user:password@ep-placeholder-000000.us-east-2.aws.neon.tech/placeholder?sslmode=require"
);

export const db = drizzle(sql, { schema });
