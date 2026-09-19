import fs from 'node:fs/promises';
import path from 'node:path';
import {load} from 'cheerio';
import {canonicalUrl,clean,fieldsFrom,hash} from './domain.mjs';
import {programmeText,hasResearchComponent} from './programme-evidence.mjs';
import {readCrawlState} from './crawl-state.mjs';

// This is an editorial reading queue, never an importer. Read only the exact
// cached response checked by the institutional crawler; do not fetch new URLs.
const output=process.argv[2]||'.cache/discovery-candidates.json';
const [state,registry,seeds]=await Promise.all([readCrawlState(),...['data/institutions.json','data/programmes.seed.json'].map(async file=>JSON.parse(await fs.readFile(file,'utf8')))]);
const institutions=new Map(registry.institutions.map(i=>[i.id,i]));
const existing=new Set(seeds.map(s=>canonicalUrl(s.url)));
const byUrl=new Map();
for(const job of state.jobs){
 if(job.status!=='read'||!['masters','phd','funding'].includes(job.type)||existing.has(canonicalUrl(job.url)))continue;
 const previous=byUrl.get(job.url);if(!previous||job.checkedAt>previous.checkedAt)byUrl.set(job.url,job);
}
const rows=[],held=[];
const fragments=(text,re,max=5)=>[...text.matchAll(re)].slice(0,max).map(m=>text.slice(Math.max(0,m.index-130),Math.min(text.length,m.index+m[0].length+240)));
for(const job of byUrl.values()){
 try{
  const page=JSON.parse(await fs.readFile('.cache/http/'+hash(job.url)+'.json','utf8'));
  if(page.hash!==job.contentHash||page.checkedAt!==job.checkedAt){held.push({url:job.url,reason:'cache_observation_changed'});continue;}
  const $=load(page.body),text=programmeText(page.body),heading=clean($('h1').first().text()),fields=fieldsFrom(text);
  if(!fields.length)continue;
  const leadFields=fieldsFrom(heading+' '+text.slice(0,1500));
  const identity=institutions.get(job.institutionId);
  const research=hasResearchComponent(text);
  const genericHeading=/^(?:our |all |find (?:a |your )?)?(?:postgraduate |graduate |international |research )?(?:masters?|master[’']?s|msc|phd|doctoral|degree|study|studien|studies|academic|scholarships?|funding)(?:[’']?s)?\s*(?:degree |study )?(?:programmes?|programs?|courses?|degrees?|studies|opportunities|overview|admissions?|funding|scholarships?)?\s*$/i.test(heading);
  rows.push({url:job.url,finalUrl:page.finalUrl,institutionId:job.institutionId,institution:identity?.name,country:job.country,type:job.type,heading,label:job.label,discoveredFrom:job.discoveredFrom,checkedAt:page.checkedAt,contentHash:page.hash,fields,leadFields,hasResearchComponent:research,genericHeading,reviewStatus:'pending-editorial-review',priority:(leadFields.length?20:0)+(job.type==='masters'&&research?10:0)-(genericHeading?20:0),opening:text.slice(0,1800),researchExcerpts:fragments(text,/\bthes(?:is|es)\b|dissertation|research project|masterarbeit|disserta[çc][aã]o|diplomov[áa]\s*pr[áa]c[ae]|kandidatspeciale|trabajo (?:de )?fin (?:de )?m[aá]ster/gi),admissionExcerpts:fragments(text,/admission requirements|entry requirements|application deadline|tuition fee|scholarship|stipend|funding is in place/gi,4)});
 }catch(error){held.push({url:job.url,reason:error.code==='ENOENT'?'cache_missing':'cache_unreadable'});}
}
rows.sort((a,b)=>a.country.localeCompare(b.country)||b.priority-a.priority||a.institution.localeCompare(b.institution)||a.url.localeCompare(b.url));
const summary={reviewCandidates:rows.length,priorityCandidates:rows.filter(x=>x.priority>=30&&!x.genericHeading).length,held:held.length,byCountry:Object.fromEntries([...new Set(rows.map(x=>x.country))].map(c=>[c,rows.filter(x=>x.country===c).length]))};
await fs.mkdir(path.dirname(output),{recursive:true});
await fs.writeFile(output,JSON.stringify({generatedAt:new Date().toISOString(),sourceRun:state.summary?.lastRun?.id,policy:'Candidates only. Institutional identity, degree versus route, discipline, current availability, thesis and duplicate programmes still require editorial review. No catalogue records are created.',summary,rows,held},null,2)+'\n');
console.log(JSON.stringify({output,...summary}));
