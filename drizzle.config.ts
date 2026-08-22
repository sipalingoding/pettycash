import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js convention: local secrets live in .env.local
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  // `generate` only diffs the local schema and doesn't need a live connection,
  // so we don't hard-fail here — but `migrate` / `push` / `studio` will error
  // clearly once they actually try to connect with this placeholder.
  console.warn(
    "[drizzle.config] DATABASE_URL is not set — copy .env.example to .env.local before running db:push / db:migrate / db:studio."
  );
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://placeholder/placeholder",
  },
  strict: true,
  verbose: true,
});
