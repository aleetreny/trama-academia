import {load} from 'cheerio';
import {canonicalUrl,clean,hash,fieldsFrom} from './domain.mjs';

const fold=s=>clean(s).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
const ignore=/\b(login|sign in|privacy|cookies?|accessibility|alumni|donate|basket|cart|logout|subscribe)\b|datenschutz|impressum/;
export function sourceType(text){
 const s=fold(text);
 if(/scholarship|fellowship|funding|studentship|bursar|bourse|becas?\b|bolsas?\b|stipend|finanzi|financi|finanzier/.test(s))return 'funding';
 if(/doctor|ph[. -]?d\b|promotion|doktor|doktora/.test(s))return 'phd';
 if(/master|msc\b|mres\b|mphil\b|magistr|mestrado|magister/.test(s))return 'masters';
 if(/vacanc|jobs?\b|careers?|recruit|stellen|offres?.emploi|lavora|empleo/.test(s))return 'jobs';
 if(/programmes?|programas?|programy|studien|study|studies|degree|courses?|formations?|graduate|postgraduate|research|recherche|ricerca|investiga/.test(s))return 'index';
 return null;
}
export function publicUrl(raw,base){
 try{
  const u=new URL(raw,base);
  if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return null;
  if(/^(?:localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(u.hostname)||u.hostname.includes(':'))return null;
  u.protocol='https:';
  if(/\.(?:jpg|png|gif|svg|webp|css|js|zip|mp4|mp3|ics|woff2?)$/i.test(u.pathname))return null;
  for(const key of u.searchParams.keys())if(/token|password|session|auth|nonce/i.test(key))return null;
  return canonicalUrl(u.href);
 }catch{return null;}
}
const hostname=url=>{try{return new URL(url).hostname.replace(/^www\./,'');}catch{return '';}};
export function approvedHosts(institution){
 return [...new Set([...(institution.domains||[]),hostname(institution.officialUrl),...(institution.sources||[]).map(s=>hostname(s.url))].filter(Boolean))];
}
export function discoverLinks(html,pageUrl,institution,{maxLinks=100}={}){
 const $=load(html),allowed=approvedHosts(institution),links=new Map();
 $('script,style,noscript,footer').remove();
 $('a[href]').each((_,element)=>{
  const a=$(element),url=publicUrl(a.attr('href'),pageUrl);if(!url||url===publicUrl(pageUrl))return;
  const label=clean(a.text()||a.attr('title')||a.attr('aria-label'));if(label.length<3||label.length>400)return;
  let pathname=new URL(url).pathname;try{pathname=decodeURI(pathname);}catch{}
  const text=label+' '+pathname,normal=fold(text);
  if(ignore.test(normal))return;
  const type=sourceType(text);if(!type)return;
  const host=hostname(url),official=allowed.some(h=>host===h||host.endsWith('.'+h));
  const subjects=fieldsFrom(text),pdf=/\.pdf$/i.test(new URL(url).pathname);
  // An anchor is a lead, not proof that a programme exists or is currently open.
  const priority=(subjects.length?20:0)+({masters:10,phd:10,funding:8,jobs:5,index:0}[type]);
  const existing=links.get(url);if(!existing||priority>existing.priority)links.set(url,{url,label,type,subjects,official,pdf,priority,discoveredFrom:pageUrl});
 });
 const all=[...links.values()].sort((a,b)=>b.priority-a.priority||a.url.localeCompare(b.url));
 return {links:all.slice(0,maxLinks),observed:all.length,truncated:all.length>maxLinks};
}
export function addDiscoveryJob(queue,institution,url,{type='home',label,depth=0,discoveredFrom=null,priority=0,observedAt}={}){
 const canonical=publicUrl(url);if(!canonical)return null;
 const id=hash(institution.id+'|'+canonical).slice(0,20);
 if(queue.has(id))return queue.get(id);
 const job={id,institutionId:institution.id,country:institution.country,url:canonical,type,label:label||institution.name,depth,discoveredFrom,priority,observedAt:observedAt||new Date().toISOString(),status:'pending',attempts:0,nextCheckAt:null};
 queue.set(id,job);return job;
}
export function selectDiscoveryJobs(jobs,{limit=900,now=Date.now(),perInstitution=20}={}){
 const countries=new Map(),lastAttempt=new Map();
 for(const job of jobs){const checked=Date.parse(job.lastAttemptAt||job.checkedAt||'')||0;lastAttempt.set(job.institutionId,Math.max(lastAttempt.get(job.institutionId)||0,checked));}
 for(const job of jobs){
  if(['document','external-review','depth-review'].includes(job.status)||(job.nextCheckAt&&Date.parse(job.nextCheckAt)>now))continue;
  const bucket=countries.get(job.country)||[];bucket.push(job);countries.set(job.country,bucket);
 }
 for(const bucket of countries.values())bucket.sort((a,b)=>(a.status==='pending'?0:1)-(b.status==='pending'?0:1)||b.priority-a.priority||a.attempts-b.attempts||a.depth-b.depth||a.id.localeCompare(b.id));
 const selected=[],counts=new Map(),buckets=[...countries].sort(([a],[b])=>a.localeCompare(b)).map(([,rows])=>{
  const groups=new Map();for(const row of rows){const group=groups.get(row.institutionId)||[];group.push(row);groups.set(row.institutionId,group);}
  // Unvisited institutions come first. Using all jobs above also remembers visits
  // whose page is currently waiting for its next permitted check.
  return [...groups].map(([id,queue])=>({id,queue})).sort((a,b)=>(lastAttempt.get(a.id)||0)-(lastAttempt.get(b.id)||0)||b.queue[0].priority-a.queue[0].priority||a.id.localeCompare(b.id));
 });
 // Rotate both countries and institutions. A high-priority catalogue must not
 // starve untouched institutions by continually generating more deep links.
 while(selected.length<limit){let progress=false;
  for(const bucket of buckets){
   while(bucket.length){const group=bucket.shift();if((counts.get(group.id)||0)>=perInstitution)continue;const job=group.queue.shift();selected.push(job);counts.set(group.id,(counts.get(group.id)||0)+1);if(group.queue.length&&(counts.get(group.id)||0)<perInstitution)bucket.push(group);progress=true;break;}
   if(selected.length>=limit)break;
  }
  if(!progress)break;
 }
 return selected;
}
