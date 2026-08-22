CREATE TABLE "divisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "divisions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "division" text DEFAULT 'Tanpa Divisi' NOT NULL;--> statement-breakpoint
CREATE INDEX "transactions_division_idx" ON "transactions" USING btree ("division");