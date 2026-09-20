import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {load} from 'cheerio';
import {getPage,observations,persistObservations} from './http.mjs';
import {programmeText} from './programme-evidence.mjs';
import {fieldsFrom,idFor} from './domain.mjs';
import {addDiscoveryJob,selectDiscoveryJobs,discoverLinks,publicUrl,isExplicitlyEmptyJobsIndex} from './institution-discovery.mjs';
import {readCrawlState,writeCrawlState} from './crawl-state.mjs';

const registryFile='data/institutions.json';
const registry=JSON.parse(await fs.readFile(registryFile,'utf8'));
const state=await readCrawlState();
const jobs=new Map(state.jobs.map(x=>[x.id,x])),institutions=new Map(registry.institutions.map(x=>[x.id,x]));
for(const institution of institutions.values()){
 const active=Object.values(institution.researchMetrics||{}).some(x=>(x.volume||0)>=20);
 if(institution.officialUrl)addDiscoveryJob(jobs,institution,institution.officialUrl,{type:'home',priority:active?6:0,observedAt:registry.generatedAt});
 for(const s of institution.sources)addDiscoveryJob(jobs,institution,s.url,{type:s.type,label:s.label,priority:15,discoveredFrom:s.discoveredFrom,observedAt:s.observedAt});
}
const numberArg=(name,fallback)=>{const value=process.argv.find(x=>x.startsWith('--'+name+'='));return value?Number(value.split('=')[1]):fallback;};
const limit=numberArg('limit',900),minutes=numberArg('minutes',40),concurrency=numberArg('concurrency',6);
if(!Number.isInteger(limit)||limit<1||limit>5000||!Number.isInteger(concurrency)||concurrency<1||concurrency>8||!Number.isFinite(minutes)||minutes<1||minutes>90)throw new Error('invalid_crawl_budget');
const startedAt=new Date().toISOString(),run={id:randomUUID(),startedAt,finishedAt:null,budget:limit,attempted:0,read:0,failed:0,discovered:0,truncatedPages:0,countries:[],status:'running'};
const deadline=Date.now()+minutes*60000,selected=selectDiscoveryJobs([...jobs.values()],{limit});let next=0,saving=Promise.resolve();
function summary(){
 const statuses={};for(const j of jobs.values())statuses[j.status]=(statuses[j.status]||0)+1;
 return {jobs:jobs.size,statuses,institutions:new Set([...jobs.values()].map(x=>x.institutionId)).size,institutionsRead:new Set([...jobs.values()].filter(x=>x.status==='read').map(x=>x.institutionId)).size,countries:new Set([...jobs.values()].map(x=>x.country)).size,updatedAt:new Date().toISOString(),lastRun:run};
}
function save(){saving=saving.then(async()=>{
 const snapshot={...state,generatedAt:new Date().toISOString(),summary:summary(),jobs:[...jobs.values()],runs:[...state.runs.slice(-19),run]};
 await writeCrawlState(snapshot);
 });return saving;}
async function worker(){while(next<selected.length&&Date.now()<deadline){
 const job=selected[next++],institution=institutions.get(job.institutionId);if(!institution)continue;
 run.attempted++;job.attempts++;job.lastAttemptAt=new Date().toISOString();
 if(!run.countries.includes(job.country))run.countries.push(job.country);
 try{
  if(/\.pdf$/i.test(new URL(job.url).pathname)){job.status='document';job.lastError=null;continue;}
  const page=await getPage(job.url),text=programmeText(page.body),heading=load(page.body)('h1').text();
  if(text.length<200&&!isExplicitlyEmptyJobsIndex(text,heading,job.type)||/page not found|404 not found|page introuvable/i.test(heading)||/enable javascript and then reload|verify that you.re not a robot/i.test(text.slice(0,500)))throw new Error('content_missing');
  const links=discoverLinks(page.body,page.finalUrl,institution);
  job.status='read';job.checkedAt=page.checkedAt;job.contentHash=page.hash;job.finalUrl=page.finalUrl;job.lastError=null;job.subjects=fieldsFrom(text.slice(0,50000));job.observedLinks=links.observed;job.truncated=links.truncated;
  job.nextCheckAt=new Date(Date.parse(page.checkedAt)+(job.type==='home'?30:7)*86400000).toISOString();run.read++;if(links.truncated)run.truncatedPages++;
  for(const link of links.links){
   const before=jobs.size,candidate=addDiscoveryJob(jobs,institution,link.url,{...link,depth:job.depth+1,observedAt:page.checkedAt,priority:link.priority+2});
   if(!candidate)continue;
   if(jobs.size>before){run.discovered++;if(!link.official)candidate.status='external-review';else if(link.pdf)candidate.status='document';else if(candidate.depth>3)candidate.status='depth-review';}
  }
  if(job.type!=='home'&&job.type!=='index'){
   const current=institution.sources.find(x=>publicUrl(x.url)===job.url);
   const update={id:current?.id||idFor('https://queue.trama.invalid/'+institution.id+'/'+idFor(job.url)),type:job.type,url:job.url,label:job.label,status:'checked',checkedAt:page.checkedAt,observedAt:job.observedAt,contentHash:page.hash,discoveredFrom:job.discoveredFrom,lastError:null};
   if(current)Object.assign(current,update);else institution.sources.push(update);
  }
 }catch(error){
  job.status='access-pending';job.lastError=error.message;job.nextCheckAt=new Date(Date.now()+7*86400000).toISOString();run.failed++;
  const current=institution.sources.find(x=>publicUrl(x.url)===job.url);if(current){current.status='access-pending';current.lastError=error.message;}
 }
 if(run.attempted%25===0){await save();console.log(JSON.stringify({attempted:run.attempted,read:run.read,failed:run.failed,discovered:run.discovered,countries:run.countries.length}));}
}}
// Depth-limited and external leads remain visible for review, never silently
// discarded and never admitted as verified opportunities by this crawler.
await save();await Promise.all(Array.from({length:concurrency},worker));
run.finishedAt=new Date().toISOString();run.status=next<selected.length?'budget-deferred':run.failed?'partial':'complete';
const byInstitution=new Map();for(const j of jobs.values()){const bucket=byInstitution.get(j.institutionId)||[];bucket.push(j);byInstitution.set(j.institutionId,bucket);}
for(const i of institutions.values()){
 const own=byInstitution.get(i.id)||[];
 i.crawl={queued:own.length,read:own.filter(x=>x.status==='read').length,pending:own.filter(x=>!['read','document'].includes(x.status)).length,documents:own.filter(x=>x.status==='document').length,lastCheckedAt:own.map(x=>x.checkedAt).filter(Boolean).sort().at(-1)||null,complete:false};
 i.reviewStatus=i.sources.some(x=>x.status==='checked')?'sources-checked':i.sources.length?'sources-discovered':'candidate';
}
registry.crawl=summary();registry.generatedAt=run.finishedAt;
await save();await fs.writeFile(registryFile+'.tmp',JSON.stringify(registry)+'\n');await fs.rename(registryFile+'.tmp',registryFile);
await persistObservations({runId:run.id});
console.log(JSON.stringify({run,...registry.crawl,observations:observations.length}));
