# Petty Cash

Buku kas kecil — Next.js 16 (App Router) + Neon Postgres (Drizzle ORM) + shadcn/ui + Tailwind CSS v4.

Seeded with the real 2025 ledger (1,579 transactions, Juli–Desember) from `Pettycash 2025.xlsx`.

## Stack

- **Next.js 16** (Turbopack, App Router, Server Actions)
- **Neon Postgres** via `@neondatabase/serverless` (HTTP driver — no connection pooling setup needed)
- **Drizzle ORM** + **drizzle-kit** for schema/migrations
- **shadcn/ui** (Base UI primitives) + **Tailwind CSS v4**
- **next-themes** for light/dark mode, **sonner** for toasts, **recharts** (via shadcn chart) for the dashboard

## Setup

1. **Create a Neon project** at [neon.tech](https://neon.tech) (free tier is plenty) and copy the pooled connection string.

2. **Configure the environment:**

   ```bash
   cp .env.example .env.local
   # edit .env.local and paste your DATABASE_URL
   ```

3. **Install dependencies** (already done if you're reading this right after scaffolding):

   ```bash
   npm install
   ```

4. **Push the schema to your database:**

   ```bash
   npm run db:push
   ```

   (Or `npm run db:migrate` to apply the generated SQL in `drizzle/0000_medical_menace.sql` instead.)

5. **Seed the real ledger data** (1,579 transactions — only runs once, skips if the table isn't empty):

   ```bash
   npm run db:seed
   ```

6. **Run the app:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a new migration from `src/db/schema.ts` |
| `npm run db:push` | Push schema directly to the DB (good for early prototyping) |
| `npm run db:migrate` | Apply migrations from `drizzle/` |
| `npm run db:studio` | Open Drizzle Studio to browse the DB |
| `npm run db:seed` | Seed the real 2025 ledger from `scripts/seed-data.json` |

## Structure

```
src/
  app/
    (app)/            # sidebar shell: dashboard, transaksi, laporan, kategori
    api/export/        # CSV export route handler
  components/          # UI components (shadcn primitives in components/ui)
  db/                   # Drizzle schema + queries
  lib/                  # server actions, formatting, category colors
scripts/
  seed.ts               # seed script
  seed-data.json         # the real 1,579-row ledger, normalized from the source spreadsheet
```

## Notes / known limitations

- **Attachments are links, not uploads.** There's no object storage (S3, Vercel Blob, etc.) wired up, so "lampiran" is a pasted URL to an already-hosted image rather than a file upload. Ask if you want real upload support added.
- **All pages are `force-dynamic`** (see `src/app/(app)/layout.tsx`) since every page reads live data — nothing is statically prerendered, which also means `next build` doesn't need `DATABASE_URL` to succeed, only `next dev`/`next start` do.
- **445 of the 1,579 real transactions have no category** in the source spreadsheet (as opposed to 16 genuinely tagged `"Lain-lain"`). These are seeded as `"Tanpa Kategori"` and surfaced via a callout banner on the Kategori page rather than being silently lumped into `"Lain-lain"`.
