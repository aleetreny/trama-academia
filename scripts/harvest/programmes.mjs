import fs from 'node:fs/promises';
import {load} from 'cheerio';
import {getPage,persistObservations} from './http.mjs';
import {clean,idFor,fieldsFrom} from './domain.mjs';
import {programmeText,hasResearchComponent} from './programme-evidence.mjs';
const seeds=JSON.parse(await fs.readFile('data/programmes.seed.json','utf8'));
const records=[],reports=[];
let next=0;
async function worker(){while(next<seeds.length){const s=seeds[next++];try{
 const page=await getPage(s.url);const $=load(page.body);const text=programmeText(page.body);
 if(/page not found|404 not found|page introuvable/i.test(clean($('h1').text()))||text.length<200)throw new Error('content_missing');
 const fields=s.kind.includes('funding')?['Ciencia de datos','Machine learning','Estadística','Informática','Matemáticas aplicadas']:fieldsFrom(s.title+' '+text.slice(0,5000));
 if(!fields.length)throw new Error('discipline_unverified');
 let researchText=text,researchUrl=page.finalUrl;
 if(s.stage==='master'&&s.kind==='programme'&&s.researchEvidenceUrl){const p=await getPage(s.researchEvidenceUrl);researchText=programmeText(p.body);researchUrl=p.finalUrl;}
 if(s.stage==='master'&&s.kind==='programme'&&!hasResearchComponent(researchText))throw new Error('research_component_unverified');
 const r={...s,id:idFor(s.url),applyUrl:s.url,sourceId:'programme-'+idFor(s.url),sourceName:s.institution,status:'programme',verifiedAt:page.checkedAt,seenAt:page.checkedAt,deadline:null,deadlinePrecision:null,fields,funding:s.funding||{kind:s.kind.includes('funding')?'scholarship':'unconfirmed',text:s.kind.includes('funding')?'Ayuda competitiva; consultar importe':'Financiación no garantizada'},duration:s.duration||null,languages:s.languages||[],contract:null,programmeType:s.programmeType||(s.stage==='master'?'Máster con componente de investigación':s.kind.includes('funding')?'Programa de financiación':'Programa doctoral'),researchNote:s.researchNote||(s.stage==='master'?'La información académica enlazada documenta una tesis, proyecto o formación orientada a investigación. Revisa el plan y la supervisión antes de decidir.':undefined),evidence:{contentHash:page.hash,checkedUrl:page.finalUrl,method:'official-programme-page',researchUrl}};
 delete r.researchEvidenceUrl;records.push(r);reports.push({id:r.sourceId,name:s.institution+' · '+s.title,url:s.url,adapter:'programme',type:s.kind.includes('funding')?'funder':'institution',scope:s.country,stages:s.eligibleStages||[s.stage],enabled:true,status:'healthy',report:{checkedAt:page.checkedAt,accepted:1,complete:true,errors:[]}});
 console.log(JSON.stringify({programme:s.title,status:'verified'}));
 }catch(e){reports.push({id:'programme-'+idFor(s.url),name:s.institution+' · '+s.title,url:s.url,adapter:'programme',type:'institution',scope:s.country,stages:[s.stage],enabled:true,status:'partial',report:{checkedAt:new Date().toISOString(),accepted:0,complete:false,errors:[{error:e.message}]}});console.log(JSON.stringify({programme:s.title,status:e.message}));}
}}
await Promise.all([worker(),worker(),worker(),worker()]);
const data=JSON.parse(await fs.readFile('data/catalogue.json','utf8'));const merged=new Map(data.records.map(r=>[r.id,r]));for(const r of records)merged.set(r.id,{...r,lastError:null});
for(const report of reports.filter(r=>r.status==='partial')){const old=[...merged.values()].find(r=>r.sourceId===report.id);if(old){old.lastError=report.report.errors[0].error;old.status='unverified';}}
const seedSourceIds=new Set(seeds.map(s=>'programme-'+idFor(s.url)));
const sources=new Map(data.sources.filter(s=>!s.id.startsWith('programme-')||seedSourceIds.has(s.id)||[...merged.values()].some(r=>r.sourceId===s.id)).map(s=>[s.id,s]));for(const r of reports)sources.set(r.id,r);
data.records=[...merged.values()];data.sources=[...sources.values()];data.programmesCheckedAt=new Date().toISOString();
await fs.writeFile('data/catalogue.json.tmp',JSON.stringify(data,null,2)+'\n');await fs.rename('data/catalogue.json.tmp','data/catalogue.json');
await persistObservations();console.log(JSON.stringify({programmesVerified:records.length,attempted:seeds.length,totalRecords:data.records.length}));
