import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {COUNTRIES,effectiveStatus,canonicalUrl} from './domain.mjs';
const data=JSON.parse(await fs.readFile('data/catalogue.json','utf8'));
const exclusions=new Set(JSON.parse(await fs.readFile('data/exclusions.json','utf8')).map(r=>r.id));
const ids=new Set(),urls=new Set(),sources=new Set(data.sources.map(s=>s.id));
for(const r of data.records){
 assert(!exclusions.has(r.id),'editorially excluded record still active: '+r.id);
 assert(!ids.has(r.id),'duplicate id: '+r.id);ids.add(r.id);const url=canonicalUrl(r.url);assert(!urls.has(url),'duplicate URL');urls.add(url);
 assert(r.title&&r.institution&&r.fields?.length,'required evidence missing: '+r.id);
 assert(sources.has(r.sourceId),'orphan source: '+r.id);
 assert(Object.values(COUNTRIES).includes(r.country)||r.country==='EU','non-European destination: '+r.id);
 assert(['grado','master','doctorado','postdoc','faculty'].includes(r.stage),'invalid stage');
 assert(r.verifiedAt&&!Number.isNaN(Date.parse(r.verifiedAt)),'missing verification');
 assert(r.evidence?.checkedUrl&&r.evidence?.method,'missing provenance');
 assert(!r.deadline||!Number.isNaN(Date.parse(r.deadline)),'invalid deadline');
 assert(!['grado','doctorado'].includes(r.stage)||r.entry!=='Doctorado','advanced role incorrectly in first steps: '+r.id);
 if(r.funding.amount!=null)assert(Number.isFinite(r.funding.amount)&&r.funding.amount>0,'invalid pay');
 if(r.kind.includes('programme'))assert(effectiveStatus(r)!=='open','programme presented as open');
}
const countBy=key=>Object.fromEntries([...new Set(data.records.map(r=>r[key]))].sort().map(x=>[x,data.records.filter(r=>r[key]===x).length]));
const report={records:data.records.length,byStage:countBy('stage'),byCountry:countBy('country'),sources:data.sources.filter(s=>s.enabled).length,partialSources:data.sources.filter(s=>s.status==='partial').map(s=>({name:s.name,errors:s.report?.errors||[]}))};
await fs.mkdir('.cache',{recursive:true});await fs.writeFile('.cache/audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,`## Catálogo TRAMA\n\n${report.records} registros preservados/publicados. ${report.partialSources.length} fuentes con revisión parcial.\n\n`+report.partialSources.map(s=>`- ${s.name}: ${s.errors.length} incidencias\n`).join(''));
