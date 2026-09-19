import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {neon} from '@neondatabase/serverless';
import {institutionMetadata,institutionSearchText,institutionPriority} from '../harvest/institution-summary.mjs';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL required');
const registry=JSON.parse(await fs.readFile('data/institutions.json','utf8'));
if(!registry.institutions.length)throw new Error('Refusing to publish an empty institution registry');
const ids=new Set();
for(const i of registry.institutions){
 if(!i.id||ids.has(i.id)||!i.name||!i.country||!Array.isArray(i.sources)||!i.researchMetrics||i._review)throw new Error('Invalid institution registry: '+i.id);
 ids.add(i.id);
 for(const metric of Object.values(i.researchMetrics))if(metric.tier&&(metric.volume<50||metric.impactEligible<50||metric.impactCoverage<.8||i.geography!=='europe'))throw new Error('Invalid research tier: '+i.id);
}
const sql=neon(process.env.DATABASE_URL);
for(let start=0;start<registry.institutions.length;start+=100){
 await sql.transaction(registry.institutions.slice(start,start+100).map(i=>{
  const payload=JSON.stringify(i),hash=createHash('sha256').update(payload).digest('hex');
  return sql`INSERT INTO institutions(id,country,name,search_text,has_sources,priority,content_hash,updated_at,payload) VALUES(${i.id},${i.country},${i.name},${institutionSearchText(i)},${i.sources.length>0},${institutionPriority(i)},${hash},${registry.generatedAt},${payload}::jsonb) ON CONFLICT(id) DO UPDATE SET country=excluded.country,name=excluded.name,search_text=excluded.search_text,has_sources=excluded.has_sources,priority=excluded.priority,content_hash=excluded.content_hash,updated_at=excluded.updated_at,payload=excluded.payload WHERE institutions.content_hash IS DISTINCT FROM excluded.content_hash`;
 }));
}
const metadata=institutionMetadata(registry);
await sql`INSERT INTO institution_editions(id,updated_at,payload) VALUES('current',${registry.generatedAt},${JSON.stringify(metadata)}::jsonb) ON CONFLICT(id) DO UPDATE SET updated_at=excluded.updated_at,payload=excluded.payload`;
console.log(JSON.stringify({published:registry.institutions.length,generatedAt:registry.generatedAt,summary:metadata.summary}));
