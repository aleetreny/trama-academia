import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {persistObservations} from './http.mjs';
import {idFor} from './domain.mjs';
import {verifyProgramme,mergeProgrammeRecords} from './programme-record.mjs';

const startedAt=new Date().toISOString();
const seeds=JSON.parse(await fs.readFile('data/programmes.seed.json','utf8'));
const records=[],reports=[];
let next=0;
async function worker(){while(next<seeds.length){
 const seed=seeds[next++];
 const source={id:'programme-'+idFor(seed.url),name:seed.institution+' · '+seed.title,url:seed.url,adapter:'programme',type:seed.kind.includes('funding')?'funder':'institution',scope:seed.country,stages:seed.eligibleStages||[seed.stage],enabled:true};
 try{
  const record=await verifyProgramme(seed);records.push(record);
  reports.push({...source,status:'healthy',report:{checkedAt:record.verifiedAt,pages:record.evidence.references.length,accepted:1,complete:true,errors:[]}});
  console.log(JSON.stringify({programme:seed.title,status:'verified'}));
 }catch(error){
  reports.push({...source,status:'partial',report:{checkedAt:new Date().toISOString(),accepted:0,complete:false,errors:[{error:error.message}]}});
  console.log(JSON.stringify({programme:seed.title,status:error.message}));
 }
}}
await Promise.all([worker(),worker(),worker(),worker()]);
const data=JSON.parse(await fs.readFile('data/catalogue.json','utf8'));
data.records=mergeProgrammeRecords(data.records,records,reports);
const seedSourceIds=new Set(seeds.map(s=>'programme-'+idFor(s.url)));
const sources=new Map(data.sources.filter(s=>!s.id.startsWith('programme-')||seedSourceIds.has(s.id)||data.records.some(r=>r.sourceId===s.id)).map(s=>[s.id,s]));
for(const report of reports)sources.set(report.id,report);
data.sources=[...sources.values()];
const finishedAt=new Date().toISOString();
const summary={startedAt,finishedAt,verified:records.length,attempted:seeds.length,partial:reports.filter(r=>r.status==='partial').length};
if(process.argv.includes('--standalone')||!data.run)data.run={id:randomUUID(),type:'programme-verification',parentRunId:data.run?.id||null,startedAt,finishedAt,status:summary.partial?'partial':'complete',sources:reports,programmes:summary};
else data.run={...data.run,finishedAt,programmes:summary,status:data.sources.some(s=>s.status==='partial')?'partial':data.run.status};
data.programmesCheckedAt=finishedAt;data.generatedAt=finishedAt;
await fs.writeFile('data/catalogue.json.tmp',JSON.stringify(data,null,2)+'\n');await fs.rename('data/catalogue.json.tmp','data/catalogue.json');
await persistObservations({runId:data.run.id});
console.log(JSON.stringify({...summary,totalRecords:data.records.length,runId:data.run.id}));
