import {load} from 'cheerio';
import {getPage} from './http.mjs';
import {clean,idFor,stageFrom,fieldsFrom,entryLevel,effectiveStatus} from './domain.mjs';
import {parseJobPosting} from './adapters.mjs';
export function parseEth(html,url,source,page){
 const $=load(html),title=clean($('#job-title').text());
 const location=clean($('.description h4').first().text());
 // ETH also advertises positions in Singapore: employer location is not job location.
 const city=location.split(',')[1]?.trim();if(!city||! /^(Zurich|Zürich|Basel|Basle|Lugano|Lausanne|Villigen|Dübendorf|Schwerzenbach|Bern|Brugg|Birmensdorf)/i.test(city))return null;
 const profile=clean($('[aria-label="Profile"]').text());
 const research=clean($('.description__introduction').text()+' '+$('[aria-label="Job description"]').text());
 const description=clean($('.description').text().split('Profile')[0]);
 const fields=fieldsFrom(title+' '+research+' '+description);const stage=stageFrom(title,'',profile);
 if(!stage||!fields.length)return null;
 const apply=$('a.application__button--link').attr('href');
 const body=clean($('.application').text());
 const rolling=/until (?:the position is )?filled|rolling basis|until filled/i.test(body);
 const r={id:idFor(url),kind:'position',stage,title,institution:'ETH Zurich',country:'CH',city,url,applyUrl:apply||url,sourceId:source.id,sourceName:source.name,verifiedAt:page.checkedAt,seenAt:page.checkedAt,status:rolling?'rolling':apply?'listed':'unverified',deadline:null,deadlinePrecision:null,fields,entry:entryLevel(profile),contract:location.split(',').slice(2).join(',').trim()||null,hours:location.split(',')[0],duration:null,languages:[],funding:{kind:'salary',text:'Contrato ETH; importe por confirmar en la oferta'},evidence:{contentHash:page.hash,checkedUrl:page.finalUrl,method:'official-vacancy-html'}};
 if(stage==='doctorado'&&r.entry==='Doctorado')r.entry=/master[’']?s?\s+degree|\bMSc\b/i.test(profile)?'Máster':/bachelor[’']?s?\s+degree|\bBSc\b/i.test(profile)?'Grado':'Consultar requisitos';
 r.status=effectiveStatus(r);return r;
}
export async function crawlEth(source,{onRecord=()=>{},onProgress=()=>{}}={}){
 const p=await getPage(source.url);const $=load(p.body);
 const all=[...new Map($('a[href]').map((_,e)=>({url:new URL($(e).attr('href'),p.finalUrl).href,title:clean($(e).text())})).get().filter(r=>/\/job\/view\//.test(r.url)).map(r=>[r.url,r])).values()];
 if(!all.length)throw new Error('listing_structure_changed');const links=all.filter(r=>stageFrom(r.title));
 const records=[],errors=[];let excluded=0;
 for(const [i,hint]of links.entries()){try{const page=await getPage(hint.url);const r=parseEth(page.body,hint.url,source,page);if(r){records.push(r);await onRecord(r);}else excluded++;}catch(e){errors.push({url:hint.url,error:e.message});}if(i%10===0)onProgress({source:source.id,visited:i+1,discovered:links.length,accepted:records.length});}
 return {records,report:{id:source.id,pages:1,totalListings:all.length,discovered:links.length,accepted:records.length,excluded,complete:true,errors,checkedAt:new Date().toISOString(),note:'Scientific career titles checked against research content; European workplace required. Faculty recruitment may use a separate portal.'}};
}
export async function crawlJobsAcUk(source,{maxPages=1000,onRecord=()=>{},onProgress=()=>{}}={}){
 const records=[],errors=[],seen=new Set(),visited=new Set();let pages=0,excluded=0,complete=true;
 for(const start of source.startUrls||[source.url]){
  let url=start;
  while(url&&pages<maxPages){
   if(visited.has(url)){errors.push({url,error:'pagination_loop'});complete=false;break;}visited.add(url);
   let page;try{page=await getPage(url);}catch(e){errors.push({url,error:e.message});complete=false;break;}
   const $=load(page.body),links=[...new Set($('a[href]').map((_,e)=>$(e).attr('href')).get().filter(h=>/^\/job\/[A-Z0-9]+\//.test(h)).map(h=>new URL(h,page.finalUrl).href))];
   if(!links.length){errors.push({url,error:'listing_structure_changed'});complete=false;break;}pages++;
   for(const link of links){if(seen.has(link))continue;seen.add(link);try{const p=await getPage(link);const r=parseJobPosting(p.body,link,source,p);if(r){records.push(r);await onRecord(r);}else excluded++;}catch(e){errors.push({url:link,error:e.message});}}
   onProgress({source:source.id,pages,discovered:seen.size,accepted:records.length});
   const next=$('a[href]').filter((_,e)=>clean($(e).text())==='Next').attr('href');url=next?new URL(next,page.finalUrl).href:null;
  }
  if(url)complete=false;
 }
 return {records,report:{id:source.id,pages,discovered:seen.size,accepted:records.length,excluded,complete,errors,checkedAt:new Date().toISOString(),note:'Computer sciences and mathematics/statistics categories, all accessible pages; overseas job locations excluded.'}};
}
