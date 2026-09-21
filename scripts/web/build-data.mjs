import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {readInstitutionRegistry} from '../harvest/registry-storage.mjs';
import {institutionMetadata,institutionPriority} from '../harvest/institution-summary.mjs';
import {statusOf} from '../../lib/types.ts';
import {createInstitutionMatcher} from './research-match.mjs';
const catalogue=JSON.parse(await fs.readFile('data/catalogue.json','utf8'));
const registry=await readInstitutionRegistry();
const output='public/data';await fs.mkdir('.web-generated',{recursive:true});
// Only generated output is rebuilt; verified source snapshots are immutable.
await fs.rm(output,{recursive:true,force:true});await fs.mkdir(output,{recursive:true});
const sizes={};
async function write(label,data){const text=JSON.stringify(data),hash=createHash('sha256').update(text).digest('hex').slice(0,16),file=`${label}.${hash}.json`;await fs.mkdir(path.dirname(path.join(output,file)),{recursive:true});await fs.writeFile(path.join(output,file),text);if(!label.includes('/'))sizes[label]={bytes:Buffer.byteLength(text),gzip:gzipSync(text).length};return 'data/'+file;}
const matcher=createInstitutionMatcher(registry.institutions),identities={},matches=[],rows=[];
const metric=m=>Object.fromEntries(['openalexId','volume','impactEligible','top10Share','impactCoverage','score','tier','reason','cohortSize'].filter(k=>m[k]!==null&&m[k]!==undefined).map(k=>[k,m[k]]));
const metrics=i=>Object.fromEntries(Object.entries(i.researchMetrics).filter(([,m])=>m.openalexId||typeof m.volume==='number'||m.tier).map(([k,v])=>[k,metric(v)]));
for(let offset=0;offset<catalogue.records.length;offset+=64){await Promise.all(catalogue.records.slice(offset,offset+64).map(async r=>{
 const match=matcher(r);if(match){identities[match.institution.id]={id:match.institution.id,name:match.institution.name,ror:match.institution.ror,metrics:metrics(match.institution)};matches.push({recordId:r.id,institutionId:match.institution.id,method:match.method});}
 const detailPath=await write('records/'+r.id,r),keys=['id','title','institution','country','funderCountry','destinationCountries','city','kind','stage','eligibleStages','recurrence','fields','status','verifiedAt','deadline','languages','lastError'];
 rows.push({...Object.fromEntries(keys.filter(k=>r[k]!==undefined).map(k=>[k,r[k]])),funding:{kind:r.funding.kind},researchInstitutionId:match?.institution.id||null,detailPath});
}));}
rows.sort((a,b)=>a.id.localeCompare(b.id));const paths={};
for(const funding of [false,true]){const records=rows.filter(r=>r.kind.includes('funding')===funding),ids=new Set(records.map(r=>r.researchInstitutionId));paths[funding?'funding':'explorer']=await write(funding?'funding':'explorer',{generatedAt:catalogue.generatedAt,records,institutions:Object.fromEntries(Object.entries(identities).filter(([id])=>ids.has(id))),researchGeneratedAt:registry.research?.generatedAt});}
const compactInstitutions=[];
for(let offset=0;offset<registry.institutions.length;offset+=64){await Promise.all(registry.institutions.slice(offset,offset+64).map(async i=>{
 const sourcePath=i.sources.length?await write('institutions/'+i.id,i.sources):null;
 const row=Object.fromEntries(['id','ror','name','aliases','country','city','officialUrl','geography','geographyNote','crawl'].filter(k=>i[k]!==undefined).map(k=>[k,i[k]]));
 compactInstitutions.push({...row,sourceCount:i.sources.length,checkedSourceCount:i.sources.filter(s=>s.status==='checked').length,priority:institutionPriority(i),sourcePath,researchMetrics:metrics(i)});
}));}
compactInstitutions.sort((a,b)=>a.id.localeCompare(b.id));paths.institutions=await write('institutions',compactInstitutions);
paths.sources=await write('sources',catalogue.sources.map(s=>({...s,report:s.report?{checkedAt:s.report.checkedAt,errors:s.report.errors}:undefined})));
const metadata={generatedAt:catalogue.generatedAt,records:catalogue.records.length,openRecords:catalogue.records.filter(r=>statusOf(r)==='open').length,sources:catalogue.sources.length,activeSources:catalogue.sources.filter(s=>s.enabled).length,countries:[...new Set(catalogue.records.map(r=>r.country).filter(c=>c!=='EU'))],countryCounts:Object.fromEntries([...new Set(catalogue.records.map(r=>r.country))].map(c=>[c,catalogue.records.filter(r=>r.country===c).length])),registry:institutionMetadata(registry),researchMatches:matches.length,partialSources:catalogue.sources.filter(s=>s.status==='partial').length};
const manifest={generatedAt:catalogue.generatedAt,records:metadata.records,sources:metadata.sources,paths,revision:createHash('sha256').update(JSON.stringify(paths)).digest('hex').slice(0,16)};
await fs.writeFile(output+'/manifest.json',JSON.stringify(manifest));await fs.writeFile('.web-generated/metadata.json',JSON.stringify(metadata));await fs.writeFile('.web-generated/matches.json',JSON.stringify(matches));await fs.writeFile('.web-generated/sizes.json',JSON.stringify(sizes,null,2));
console.log(JSON.stringify({records:rows.length,institutions:compactInstitutions.length,matchedRecords:matches.length,matchedInstitutions:Object.keys(identities).length,indexes:sizes}));
