import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {institutionGeography} from './institution-universe.mjs';
import {computeTiers} from './research-tiers.mjs';
const normal=s=>String(s||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const host=url=>{try{return new URL(url).hostname.replace(/^www\./,'');}catch{return null;}};
const [universeFile='work/ror/universe.json',rorFile='work/ror/records.json',curatedFile='data/institutions.curated.json',output='data/institutions.json']=process.argv.slice(2);
const data=JSON.parse(await fs.readFile(universeFile,'utf8'));
const allRor=JSON.parse(await fs.readFile(rorFile,'utf8')).filter(x=>x.status==='active');
const curated=JSON.parse(await fs.readFile(curatedFile,'utf8'));
let previous;try{previous=JSON.parse(await fs.readFile(output,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const byName=new Map(),byHost=new Map(),byRor=new Map(allRor.map(x=>[x.id,x]));
for(const row of allRor){
 for(const g of row.locations.map(x=>x.geonames_details)){
  for(const name of row.names){const key=g.country_code+'|'+normal(name.value);const values=byName.get(key)||new Set();values.add(row);byName.set(key,values);}
  for(const domain of [...row.domains,...row.links.filter(x=>x.type==='website').map(x=>host(x.value))].filter(Boolean)){
   const key=g.country_code+'|'+domain;const values=byHost.get(key)||new Set();values.add(row);byHost.set(key,values);
  }
 }
}
const institutions=new Map(data.institutions.map(x=>[x.id,x]));const matches=[];
for(const item of curated){
 const names=byName.get(item.country+'|'+normal(item.name))||new Set();
 const domains=new Set();for(const domain of [...(item.domains||[]),item.domain,item.officialDomain,host(item.officialUrl)].filter(Boolean))for(const match of byHost.get(item.country+'|'+domain)||[])domains.add(match);
 const options=names.size===1?names:domains.size===1?domains:new Set();
 const explicit=item.ror?byRor.get(item.ror):null;
 if(item.ror&&(!explicit||!explicit.locations.some(x=>x.geonames_details.country_code===item.country)))throw new Error('invalid_editorial_ror: '+item.id);
 const ror=explicit||(options.size===1?[...options][0]:null);
 const id=ror?ror.id.split('/').at(-1):'curated-'+item.id;
 let record=institutions.get(id);
 if(!record){
  const location=ror?.locations.find(x=>x.geonames_details.country_code===item.country)?.geonames_details;
  record={id,ror:ror?.id||null,name:ror?.names.find(x=>x.types.includes('ror_display'))?.value||item.name,aliases:ror?.names.map(x=>x.value)||[],country:item.country,city:location?.name||item.city||null,coordinates:location?{lat:location.lat,lng:location.lng}:null,officialUrl:ror?.links.find(x=>x.type==='website')?.value||item.officialUrl||null,domains:ror?.domains||[],types:ror?.types||['research-source'],geography:institutionGeography(item.country),reviewStatus:'candidate',sources:[],researchMetrics:{},provenance:ror?{source:'ROR',release:data.provenance.url}:{source:'official-source-review'}};
 }
 const sourceMap=new Map(record.sources.map(x=>[x.url,x]));
 for(const source of item.sources||[]){
  const checked=Boolean(source.checkedAt&&source.contentHash);
  const next={id:createHash('sha256').update(id+'|'+source.url).digest('hex').slice(0,20),type:source.type,url:source.url,label:source.label,status:checked?'checked':source.accessOutcome&&source.accessOutcome!=='not_fetched'&&source.accessOutcome!=='ok'?'access-pending':'discovered',checkedAt:checked?source.checkedAt:null,observedAt:source.observedAt||item.observedAt||new Date().toISOString(),contentHash:source.contentHash||null,discoveredFrom:source.discoveredFrom||null,lastError:source.accessOutcome&& !['ok','not_fetched'].includes(source.accessOutcome)?source.accessOutcome:null};
  if(!sourceMap.get(source.url)?.contentHash||checked)sourceMap.set(source.url,next);
 }
 record.sources=[...sourceMap.values()];record.reviewStatus=record.sources.some(x=>x.status==='checked')?'sources-checked':'sources-discovered';
 record.aliases=[...new Set([...record.aliases,item.name])].filter(x=>x!==record.name);
 record.discoveryIds=[...new Set([...(record.discoveryIds||[]),item.id])];
 if(item.geographyNote||item._review?.geographyNote)record.geographyNote=item.geographyNote||item._review.geographyNote;
 if(item.parentInstitutionId)record.parentDiscoveryId=item.parentInstitutionId;
 institutions.set(id,record);matches.push({discoveryId:item.id,institutionId:id,name:item.name,ror:ror?.id||null,method:explicit?'editorial-ror':names.size===1?'exact-name':domains.size===1?'unique-domain':'unmatched',candidates:[...new Set([...names,...domains])].map(x=>({id:x.id,name:x.names.find(n=>n.types.includes('ror_display'))?.value}))});
}
// Rebuilding identities must not erase work completed by the resumable crawler.
for(const old of previous?.institutions||[]){
 const current=institutions.get(old.id);if(!current)continue;
 const sources=new Map(current.sources.map(s=>[s.url,s]));
 for(const source of old.sources){const next=sources.get(source.url);if(!next||!next.checkedAt||source.checkedAt&&source.checkedAt>=next.checkedAt)sources.set(source.url,source);}
 current.sources=[...sources.values()];if(old.crawl)current.crawl=old.crawl;
 current.reviewStatus=current.sources.some(s=>s.status==='checked')?'sources-checked':current.sources.length?'sources-discovered':'candidate';
}
if(previous?.crawl)data.crawl=previous.crawl;
data.institutions=[...institutions.values()];
try{
 const metrics=JSON.parse(await fs.readFile('work/openalex/indicators.json','utf8'));
 if(!metrics.workTypes?.includes('conference-paper'))throw new Error('research_metrics_require_conference_papers');
 const identities=JSON.parse(await fs.readFile('work/openalex/identities.json','utf8'));
 data.research={provider:'OpenAlex',license:'CC0-1.0',generatedAt:metrics.generatedAt,status:metrics.status,workTypes:metrics.workTypes,activityWindow:[2020,2024],impactWindow:[2020,2022],subjects:[]};
 for(const subject of metrics.subjects){
  const rows=computeTiers(data.institutions,subject,identities.directory);
  data.research.subjects.push({id:subject.id,name:subject.name,taxonomy:subject.taxonomy,countryScope:subject.countryScope,cohortSize:rows.filter(x=>x.tier).length,references:Object.fromEntries(Object.entries(subject.metrics).map(([name,m])=>[name,{url:m.references[0]?.url,urls:m.references.filter(x=>new URL(x.url).searchParams.get('cursor')==='*').map(x=>x.url),pages:m.references.length,groups:m.groups.length,checkedAt:m.references.map(x=>x.checkedAt).sort()[0]}]))});
  for(const row of rows){const {institutionId,...metric}=row;institutions.get(institutionId).researchMetrics[subject.id]=metric;}
 }
}catch(error){if(error.code!=='ENOENT')throw error;}
data.generatedAt=new Date().toISOString();data.institutions.sort((a,b)=>a.country.localeCompare(b.country)||a.name.localeCompare(b.name));
await fs.writeFile(output,JSON.stringify(data)+'\n');await fs.writeFile('work/discovery/institution-matches.json',JSON.stringify(matches,null,2));
console.log(JSON.stringify({total:data.institutions.length,curated:curated.length,matched:matches.filter(x=>x.ror).length,unmatched:matches.filter(x=>!x.ror).map(x=>({id:x.discoveryId,name:x.name,candidates:x.candidates})),subjects:data.research?.subjects?.map(x=>({id:x.id,cohort:x.cohortSize})),output}));
