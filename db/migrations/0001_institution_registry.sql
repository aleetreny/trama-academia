CREATE TABLE "institution_editions" (
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" text PRIMARY KEY NOT NULL,
	"country" text NOT NULL,
	"name" text NOT NULL,
	"search_text" text NOT NULL,
	"has_sources" boolean NOT NULL,
	"priority" boolean NOT NULL,
	"content_hash" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "institutions_country_idx" ON "institutions" USING btree ("country");--> statement-breakpoint
CREATE INDEX "institutions_priority_name_idx" ON "institutions" USING btree ("priority","has_sources","name");