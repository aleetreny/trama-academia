import fs from 'node:fs/promises';
import {neon} from '@neondatabase/serverless';
import {createHash} from 'node:crypto';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL required');
const sql=neon(process.env.DATABASE_URL);
const data=JSON.parse(await fs.readFile('data/catalogue.json','utf8'));
if(!data.records.length)throw new Error('Refusing to publish an empty catalogue');
const currentSourceIds=new Set(data.sources.map(s=>s.id));
const exclusions=JSON.parse(await fs.readFile('data/exclusions.json','utf8'));
const excludedIds=new Set(exclusions.map(r=>r.id));
if(data.records.some(r=>excludedIds.has(r.id)))throw new Error('Excluded record remains in the snapshot; audit before publishing');
const existingSources=await sql`SELECT id FROM sources`;
for(const s of existingSources.filter(s=>!currentSourceIds.has(s.id)))await sql`UPDATE sources SET status='retired',payload=payload || '{"enabled":false,"status":"retired"}'::jsonb WHERE id=${s.id}`;
for(const r of exclusions)await sql`UPDATE opportunities SET status='excluded',payload=payload || '{"status":"excluded"}'::jsonb WHERE id=${r.id}`;
// Each transaction is bounded; no deletion on omission, partial crawls or network errors.
for(let i=0;i<data.records.length;i+=100){
 const batch=data.records.slice(i,i+100);
 await sql.transaction(batch.map(r=>sql`INSERT INTO opportunities (id,kind,stage,title,institution,country,url,status,deadline,verified_at,seen_at,payload) VALUES (${r.id},${r.kind},${r.stage},${r.title},${r.institution},${r.country},${r.url},${r.status},${r.deadline},${r.verifiedAt},${r.seenAt},${JSON.stringify(r)}::jsonb) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,stage=excluded.stage,title=excluded.title,institution=excluded.institution,country=excluded.country,status=excluded.status,deadline=excluded.deadline,verified_at=excluded.verified_at,seen_at=excluded.seen_at,payload=excluded.payload`));
}
if(data.sources.length)await sql.transaction(data.sources.map(s=>sql`INSERT INTO sources(id,name,url,adapter,status,checked_at,payload) VALUES(${s.id},${s.name},${s.url},${s.adapter},${s.status||'planned'},${s.report?.checkedAt||null},${JSON.stringify(s)}::jsonb) ON CONFLICT(id) DO UPDATE SET name=excluded.name,url=excluded.url,adapter=excluded.adapter,status=excluded.status,checked_at=excluded.checked_at,payload=excluded.payload`));
if(data.run)await sql`INSERT INTO crawl_runs(id,started_at,finished_at,status,records,report) VALUES(${data.run.id},${data.run.startedAt},${data.run.finishedAt},${data.run.status},${data.records.length},${JSON.stringify(data.run)}::jsonb) ON CONFLICT(id) DO UPDATE SET finished_at=excluded.finished_at,status=excluded.status,records=excluded.records,report=excluded.report`;
try{const {runId,observations}=JSON.parse(await fs.readFile('.cache/observations.json','utf8'));for(let i=0;i<observations.length;i+=100)await sql.transaction(observations.slice(i,i+100).map(o=>sql`INSERT INTO observations(id,run_id,url,checked_at,http_status,content_hash,outcome) VALUES(${createHash('sha256').update(o.url+'|'+o.checkedAt).digest('hex')},${o.runId||runId||data.run.id},${o.url},${o.checkedAt},${o.httpStatus},${o.hash},${o.outcome}) ON CONFLICT(id) DO NOTHING`));}catch(e){if(e.code!=='ENOENT')throw e;}
const count=await sql`SELECT count(*)::int AS count FROM opportunities`;
console.log(JSON.stringify({published:data.records.length,databaseRecords:count[0].count,generatedAt:data.generatedAt}));
