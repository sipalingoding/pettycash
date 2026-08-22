CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tx_no" integer NOT NULL,
	"date" date NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'Tanpa Kategori' NOT NULL,
	"amount_in" numeric(14, 2) DEFAULT 0 NOT NULL,
	"amount_out" numeric(14, 2) DEFAULT 0 NOT NULL,
	"balance" numeric(14, 2) NOT NULL,
	"attachment_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_tx_no_unique" UNIQUE("tx_no")
);
--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transactions_category_idx" ON "transactions" USING btree ("category");