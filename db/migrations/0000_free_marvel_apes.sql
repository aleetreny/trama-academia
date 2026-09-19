CREATE TABLE "observations" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"url" text NOT NULL,
	"checked_at" timestamp with time zone NOT NULL,
	"http_status" integer,
	"content_hash" text,
	"outcome" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"stage" text NOT NULL,
	"title" text NOT NULL,
	"institution" text NOT NULL,
	"country" text NOT NULL,
	"url" text NOT NULL,
	"status" text NOT NULL,
	"deadline" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"seen_at" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL,
	CONSTRAINT "opportunities_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "crawl_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text NOT NULL,
	"records" integer DEFAULT 0 NOT NULL,
	"report" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"adapter" text NOT NULL,
	"status" text NOT NULL,
	"checked_at" timestamp with time zone,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "observations_url_checked_idx" ON "observations" USING btree ("url","checked_at");--> statement-breakpoint
CREATE INDEX "opportunities_stage_country_idx" ON "opportunities" USING btree ("stage","country");--> statement-breakpoint
CREATE INDEX "opportunities_deadline_idx" ON "opportunities" USING btree ("deadline");