CREATE INDEX IF NOT EXISTS "observations_url_hash_checked_idx" ON "observations" USING btree (md5("url"),"checked_at");--> statement-breakpoint
DROP INDEX IF EXISTS "observations_url_checked_idx";
