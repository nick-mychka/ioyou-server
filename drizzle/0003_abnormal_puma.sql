CREATE TYPE "public"."record_kind" AS ENUM('loan', 'debt');--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "record_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	CONSTRAINT "record_statuses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"amount" numeric NOT NULL,
	"currency_id" uuid NOT NULL,
	"note" text,
	"loan_date" date NOT NULL,
	"due_date" date,
	"kind" "record_kind" NOT NULL,
	"status_id" uuid NOT NULL,
	"interest_rate" numeric,
	"penalty" numeric
);
--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_status_id_record_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."record_statuses"("id") ON DELETE no action ON UPDATE no action;