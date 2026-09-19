import { pgTable, text, timestamp, jsonb, integer, index, boolean } from 'drizzle-orm/pg-core';

export const opportunities = pgTable('opportunities', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  stage: text('stage').notNull(),
  title: text('title').notNull(),
  institution: text('institution').notNull(),
  country: text('country').notNull(),
  url: text('url').notNull().unique(),
  status: text('status').notNull(),
  deadline: timestamp('deadline', { withTimezone: true }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  seenAt: timestamp('seen_at', { withTimezone: true }).notNull(),
  payload: jsonb('payload').notNull(),
}, (t) => [index('opportunities_stage_country_idx').on(t.stage,t.country), index('opportunities_deadline_idx').on(t.deadline)]);

export const sources = pgTable('sources', {
  id: text('id').primaryKey(), name: text('name').notNull(), url: text('url').notNull(),
  adapter: text('adapter').notNull(), status: text('status').notNull(),
  checkedAt: timestamp('checked_at', { withTimezone:true }),
  payload: jsonb('payload').notNull(),
});
export const runs = pgTable('crawl_runs', {
  id:text('id').primaryKey(), startedAt:timestamp('started_at',{withTimezone:true}).notNull(),
  finishedAt:timestamp('finished_at',{withTimezone:true}), status:text('status').notNull(),
  records:integer('records').notNull().default(0), report:jsonb('report').notNull(),
});
export const observations = pgTable('observations', {
  id:text('id').primaryKey(), runId:text('run_id').notNull(), url:text('url').notNull(),
  checkedAt:timestamp('checked_at',{withTimezone:true}).notNull(), httpStatus:integer('http_status'),
  hash:text('content_hash'), outcome:text('outcome').notNull(),
},(t)=>[index('observations_url_checked_idx').on(t.url,t.checkedAt)]);

export const institutions = pgTable('institutions', {
  id:text('id').primaryKey(), country:text('country').notNull(), name:text('name').notNull(),
  searchText:text('search_text').notNull(), hasSources:boolean('has_sources').notNull(),
  priority:boolean('priority').notNull(), contentHash:text('content_hash').notNull(),
  updatedAt:timestamp('updated_at',{withTimezone:true}).notNull(), payload:jsonb('payload').notNull(),
},(t)=>[index('institutions_country_idx').on(t.country),index('institutions_priority_name_idx').on(t.priority,t.hasSources,t.name)]);

export const institutionEditions = pgTable('institution_editions', {
  id:text('id').primaryKey(), updatedAt:timestamp('updated_at',{withTimezone:true}).notNull(),
  payload:jsonb('payload').notNull(),
});
