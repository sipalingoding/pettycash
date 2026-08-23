CREATE TABLE "transaction_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" integer NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transaction_attachments" ADD CONSTRAINT "transaction_attachments_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transaction_attachments_transaction_id_idx" ON "transaction_attachments" USING btree ("transaction_id");--> statement-breakpoint
INSERT INTO "transaction_attachments" ("transaction_id", "url")
SELECT "id", "attachment_url" FROM "transactions" WHERE "attachment_url" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "attachment_url";