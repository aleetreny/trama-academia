import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {crawlEuraxess,crawlInria,crawlAcademicTransfer} from './adapters.mjs';
import {crawlJobsAcUk,crawlEth} from './extra-adapters.mjs';
import {crawlNordic} from './nordic-adapters.mjs';
import {crawlJobbnorge} from './jobbnorge.mjs';
import {effectiveStatus,canonicalUrl} from './domain.mjs';
import {observations,persistObservations} from './http.mjs';

const args=process.argv.slice(2),maxPages=Number(args.find(x=>x.startsWith('--pages='))?.split('=')[1]||1000);
const only=args.find(x=>x.startsWith('--source='))?.split('=')[1]?.split(',');
const sourceRegistry=JSON.parse(await fs.readFile('data/sources.json','utf8'));
const initial=JSON.parse(await fs.readFile('data/catalogue.json','utf8'));
const exclusions=new Set(JSON.parse(await fs.readFile('data/exclusions.json','utf8')).map(e=>e.id));
const records=new Map(initial.records.map(r=>[r.id,r]));
const run={id:randomUUID(),startedAt:new Date().toISOString(),finishedAt:null,status:'running',sources:[]};
await fs.mkdir('.cache',{recursive:true});
let writes=Promise.resolve();
function checkpoint(){writes=writes.then(()=>fs.writeFile('.cache/harvest-progress.json',JSON.stringify({run,records:records.size,observations:observations.length},null,2)));return writes;}
function onRecord(record){if(exclusions.has(record.id))return;records.set(record.id,{...records.get(record.id),...record,lastError:record.lastError||null});if(records.size%25===0)return checkpoint();}
const active=sourceRegistry.filter(s=>s.enabled&&(!only||only.includes(s.id)));
const results=await Promise.allSettled(active.map(async source=>{
  const fn={euraxess:crawlEuraxess,inria:crawlInria,'sitemap-jobposting':crawlAcademicTransfer,jobsacuk:crawlJobsAcUk,eth:crawlEth,kth:crawlNordic,aalto:crawlNordic,uppsala:crawlNordic,helsinki:crawlNordic,jobbnorge:crawlJobbnorge}[source.adapter];if(!fn)throw new Error('adapter_not_implemented');
  const result=await fn(source,{maxPages,onRecord,knownRecord:id=>records.get(id),onProgress:p=>{console.log(JSON.stringify(p));checkpoint();}});
  const editorialExclusions=result.records.filter(r=>exclusions.has(r.id)).length;
  if(editorialExclusions){result.report.accepted-=editorialExclusions;result.report.excluded=(result.report.excluded||0)+editorialExclusions;result.report.editorialExclusions=editorialExclusions;}
  run.sources.push(result.report);return result;
}));
for(const [i,result]of results.entries())if(result.status==='rejected')run.sources.push({id:active[i].id,complete:false,errors:[{error:String(result.reason)}],checkedAt:new Date().toISOString()});
run.finishedAt=new Date().toISOString();run.status=run.sources.every(s=>s.complete&&!s.errors.length)?'success':'partial';
if(!records.size){run.status='failed';await checkpoint();throw new Error('No records: preserving previous snapshot');}
// Deduplicate identical canonical offer URLs. Do not collapse distinct vacancies with similar titles.
const byUrl=new Map();for(const r of records.values()){if(exclusions.has(r.id))continue;r.status=effectiveStatus(r);byUrl.set(canonicalUrl(r.url),r);}
const all=[...byUrl.values()];const registry=[...new Map([...initial.sources,...sourceRegistry].map(s=>[s.id,s])).values()];const sources=registry.map(s=>{const report=run.sources.find(r=>r.id===s.id)||initial.sources.find(r=>r.id===s.id)?.report;return {...s,status:report?(report.complete&&!report.errors.length?'healthy':'partial'):s.enabled?'pending':'planned',report};});
const snapshot={generatedAt:run.finishedAt,records:all,sources,run};
await fs.writeFile('data/catalogue.json.tmp',JSON.stringify(snapshot,null,2)+'\n');await fs.rename('data/catalogue.json.tmp','data/catalogue.json');
await persistObservations({runId:run.id});await checkpoint();
console.log(JSON.stringify({run:run.id,status:run.status,records:all.length,open:all.filter(r=>r.status==='open').length,sources:run.sources}));
