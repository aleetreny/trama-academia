import {load} from 'cheerio';
import {COUNTRIES,clean,idFor,fieldsFrom,stageFrom,entryLevel,effectiveStatus,salaryFromText,requiredDegree,durationFrom} from './domain.mjs';
import {getPage} from './http.mjs';

function visible($){$('script,style,nav,header,footer,[hidden],[aria-hidden="true"],[style*="display:none"],[style*="display: none"]').remove();return clean(($('main').length?$('main'):$('body')).text());}
function ddMap($){const data={};$('dt').each((_,el)=>{const k=clean($(el).text());const v=clean($(el).next('dd').text());if(v)(data[k]??=[]).push(v);});return data;}
function base(source,url,page){return {id:idFor(url),kind:'position',url,applyUrl:url,sourceId:source.id,sourceName:source.name,verifiedAt:page.checkedAt,seenAt:page.checkedAt,status:'unverified',deadline:null,deadlinePrecision:null,fields:[],funding:{kind:'unconfirmed',text:'Financiación por confirmar'},duration:null,entry:'Consultar requisitos',languages:[],contract:null,city:null,evidence:{contentHash:page.hash,checkedUrl:page.finalUrl,method:'structured-html'}};}

export function parseEuraxessList(html,origin){
  const $=load(html),rows=[];
  $('h3 a[href]').each((_,a)=>{const href=$(a).attr('href');if(!/^\/(jobs|funding|jobs\/hosting)\/\d+$/.test(href))return;const row=$(a).closest('li.ecl-list-item');const node=row.length?row:$(a).closest('article').parent();
    const country=clean(node.find('.ecl-label--highlight').first().text());
    const title=clean($(a).text());const research=clean(node.find('.id-Research-Field').text());
    if(!COUNTRIES[country]||!fieldsFrom(title+' '+research).length)return;
    const institution=clean(node.find('.ecl-content-block__primary-meta-item a').first().text());rows.push({url:new URL(href,origin).href,title,institution,country:COUNTRIES[country]});
  });
  const next=$('a[rel="next"]').attr('href')||$('a').filter((_,e)=>clean($(e).text())==='Next').attr('href');
  const total=Number(clean($('h2').filter((_,e)=>/Search results/.test($(e).text())).text()).match(/\(([\d, ]+)\)/)?.[1]?.replace(/[^\d]/g,''))||null;
  return {rows,next:next?new URL(next,origin).href:null,total};
}
export function parseEuraxess(html,url,source,page,hint={}){
  const $=load(html),values=ddMap($);const v=k=>values[k]?.[0]||'';
  const title=clean($('h1').text()).replace(/^(Job offer|Funding offer|Hosting offer)\s*/i,'');
  const research=(values['Research Field']||[]).join(' ');const fields=fieldsFrom(title+' '+research);
  const countries=[...new Set(values.Country||[])];if(!countries.length||countries.some(c=>!COUNTRIES[c]))return null;
  const country=COUNTRIES[countries[0]];const stage=stageFrom(title,v('Researcher Profile'),v('Education Level'));
  if(!stage||!fields.length||!title)return null;
  const dt=$('dt').filter((_,e)=>clean($(e).text())==='Application Deadline').first().next('dd').find('time').attr('datetime');
  const deadline=dt&&!Number.isNaN(Date.parse(dt))?new Date(dt).toISOString():null;
  const apply=$('a').filter((_,e)=>/^Apply now$/i.test(clean($(e).text()))).attr('href');
  const institution=hint.institution||v('Company/Institute')||v('Organisation/Company');
  const body=visible($);const record={...base(source,url,page),title,institution,country,stage,fields,deadline,deadlinePrecision:deadline?'timestamp':null,entry:entryLevel(v('Education Level')),contract:v('Type of Contract')||null,hours:v('Job Status')||null,city:v('City')||null,languages:values.Languages||[],applyUrl:apply&&/^https:\/\//.test(apply)?apply:url};
  if(/Temporary|Permanent/i.test(record.contract||''))record.funding={kind:'salary',text:'Contrato; importe no publicado'};
  // EURAXESS includes a hidden expiry template even for open offers. Only visible text can close a record.
  if(/STATUS:\s*EXPIRED|offer is no longer available|position has been filled/i.test(body))record.status='closed';
  record.status=effectiveStatus(record);return record;
}

export function parseInriaList(html,origin){const $=load(html);return [...new Map($('a[href]').map((_,a)=>{const href=$(a).attr('href');if(!/\/offres\/\d{4}-\d+$/.test(href))return null;const title=clean($(a).text());return {url:new URL(href,origin).href,title};}).get().filter(r=>stageFrom(r.title)).map(r=>[r.url,r])).values()];}
export function parseInria(html,url,source,page){
  const $=load(html),title=clean($('h1').text());const values={};$('li strong').each((_,e)=>{const k=clean($(e).text()).replace(/\s*:\s*$/,'');values[k]=clean($(e).parent().text()).replace(clean($(e).text()),'').trim();});
  const section=name=>{const h=$('h2').filter((_,e)=>clean($(e).text()).toLowerCase()===name.toLowerCase()).first();return clean(h.next().text());};
  const body=visible($);const qualification=body.match(/Level of qualifications required\s*:\s*(.*?)\s*Fonction\s*:/i)?.[1]||'';
  const stage=stageFrom(title,'',qualification);const fields=fieldsFrom(title+' '+(values['Theme/Domain']||'')+' '+section('Assignment').slice(0,1000));
  if(!stage||!fields.length)return null;
  if(/humanities|sciences humaines et sociales|business development|market analyst|formation en|p[ée]dagogique/i.test(title))return null;
  const date=values['Deadline to apply']?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  const remuneration=section('Remuneration')||section('Rémunération');
  const record={...base(source,url,page),title,institution:'Inria',country:'FR',city:values['Town/city']||null,stage,fields,deadline:date||null,deadlinePrecision:date?'day':null,duration:values['Duration of contract']||null,entry:entryLevel(qualification),contract:body.match(/Contract type\s*:\s*(.*?)\s*Level of qualifications/i)?.[1]||null,languages:[],funding:remuneration?salaryFromText(remuneration):{kind:'unconfirmed',text:'Financiación por confirmar'}};
  if(/offer is no longer available|position has been filled|offre.*pourvue/i.test(body))record.status='closed';
  record.status=effectiveStatus(record);return record;
}

function jobPosting($){
  function walk(v){if(!v||typeof v!=='object')return null;if(v['@type']==='JobPosting'||(Array.isArray(v['@type'])&&v['@type'].includes('JobPosting')))return v;for(const x of Object.values(v)){if(x&&typeof x==='object'){const r=Array.isArray(x)?x.map(walk).find(Boolean):walk(x);if(r)return r;}}return null;}
  for(const e of $('script[type="application/ld+json"]').toArray()){try{const v=walk(JSON.parse($(e).text()));if(v)return v;}catch{}}return null;
}
export function parseJobPosting(html,url,source,page){
 const $=load(html),j=jobPosting($);if(!j)return null;
 const title=clean(j.title),desc=clean(load(j.description||'').text());
 const locs=Array.isArray(j.jobLocation)?j.jobLocation:[j.jobLocation];
 const places=locs.map(l=>l?.address).filter(Boolean);const countryValues=places.map(p=>typeof p.addressCountry==='object'?p.addressCountry.name:p.addressCountry);
 const countries=countryValues.map(c=>Object.values(COUNTRIES).includes(c)?c:COUNTRIES[c]);
 if(!countries.length||countries.some(c=>!c))return null;
 const qualification=typeof j.educationRequirements==='string'?j.educationRequirements:clean(j.educationRequirements?.credentialCategory||'');
 const stage=stageFrom(title,'',qualification);const fields=fieldsFrom(title+' '+clean(j.occupationalCategory||'')+' '+clean(j.hiringOrganization?.department?.name||'')+' '+desc.slice(0,1800));
 if(!stage||!fields.length)return null;
 const salary=j.baseSalary,sv=salary?.value;const amount=typeof sv==='number'?sv:sv?.value;const min=sv?.minValue,max=sv?.maxValue;const currency=salary?.currency;const period=sv?.unitText;
 const salaryText=amount?amount+' '+(currency||'')+(period?' / '+period:''):min&&max?min+'–'+max+' '+(currency||'')+(period?' / '+period:''):'Contrato; importe por confirmar';
 const requirement=desc.split(/(?<=[.!?])\s+/).find(s=>/candidates? (?:should|must|will)|you (?:must|should|will) (?:have|hold)|required.*degree|hold a (?:PhD|Master|Bachelor)/i.test(s))||'';
 const record={...base(source,url,page),title,institution:clean(j.hiringOrganization?.name||source.name),country:countries[0],city:places[0]?.addressLocality||null,stage,fields,deadline:j.validThrough&&!Number.isNaN(Date.parse(j.validThrough))?(source.id==='jobsacuk'?j.validThrough.slice(0,10):j.validThrough):null,deadlinePrecision:j.validThrough?(source.id==='jobsacuk'?'day':'timestamp'):null,entry:entryLevel(qualification||requirement||(stage==='faculty'||stage==='postdoc'?'Doctoral degree':'')),contract:Array.isArray(j.employmentType)?j.employmentType.join(', '):j.employmentType||null,funding:{kind:salary?(stage==='doctorado'&&countries[0]==='GB'&&/studentship|scholarship|stipend/i.test(title+' '+desc)?'scholarship':'salary'):'unconfirmed',text:salaryText,amount:amount?Number(amount):null,currency:currency||null,period:/month/i.test(period||'')?'month':/year/i.test(period||'')?'year':null},evidence:{contentHash:page.hash,checkedUrl:page.finalUrl,method:'schema.org/JobPosting'}};
 const structuredDegree=entryLevel(qualification);const degree=requiredDegree(desc);
 record.entry=structuredDegree!=='Consultar requisitos'?structuredDegree:degree;
 record.duration=durationFrom(desc);
 // A mention of a doctoral project is not a doctoral entry requirement.
 if(stage==='doctorado'&&record.entry==='Doctorado')record.entry='Consultar requisitos';
 // Qualification mentions in prose may describe colleagues, so don't infer a degree from the full description.
 const text=visible($);if(/vacancy has expired|vacancy is no longer available|position has been filled/i.test(text))record.status='closed';
 record.status=effectiveStatus(record);return record;
}
export async function crawlAcademicTransfer(source,{onRecord=()=>{},onProgress=()=>{}}={}){
 const sitemap=await getPage('https://www.academictransfer.com/sitemap-vacancies.xml');const $=load(sitemap.body,{xmlMode:true});
 const all=$('loc').map((_,e)=>$(e).text()).get();if(!all.length)throw new Error('sitemap_empty');
 const links=all.filter(url=>{const title=decodeURIComponent(url).split('/').filter(Boolean).at(-1).replaceAll('-',' ');return stageFrom(title)&&fieldsFrom(title).length;});
 const records=[],errors=[];let excluded=0;
 for(const [i,url]of links.entries()){try{const page=await getPage(url);const r=parseJobPosting(page.body,url,source,page);if(r){records.push(r);await onRecord(r);}else excluded++;}catch(e){errors.push({url,error:e.message});}if(i%5===0)onProgress({source:source.id,visited:i+1,discovered:links.length,accepted:records.length});}
 return {records,report:{id:source.id,pages:1,discovered:links.length,totalListings:all.length,accepted:records.length,excluded,complete:true,errors,checkedAt:new Date().toISOString(),note:'Discovery limited to discipline-bearing vacancy titles; jobs with generic titles require another pass.'}};
}

export async function crawlEuraxess(source,{maxPages=1000,onRecord=()=>{},onProgress=()=>{}}={}){
  let url=source.url,pages=0,discovered=0,excluded=0,errors=[],total=null;const seen=new Set(),visited=new Set(),records=[];
  while(url&&pages<maxPages){
    if(visited.has(url)){errors.push({url,error:'pagination_loop'});break;}visited.add(url);
    const page=await getPage(url);const list=parseEuraxessList(page.body,page.finalUrl);total??=list.total;pages++;
    if(!/Search results/i.test(page.body))throw new Error('listing_structure_changed');
    for(const hint of list.rows){if(seen.has(hint.url))continue;seen.add(hint.url);discovered++;
      try{const p=await getPage(hint.url);const r=parseEuraxess(p.body,hint.url,source,p,hint);if(r){records.push(r);await onRecord(r);}else excluded++;}catch(e){errors.push({url:hint.url,error:e.message});}
    }
    if(pages%10===0)onProgress({source:source.id,pages,discovered,records:records.length,total});url=list.next;
  }
  return {records,report:{id:source.id,pages,discovered,accepted:records.length,excluded,totalListings:total,complete:!url,errors,checkedAt:new Date().toISOString()}};
}
export async function crawlInria(source,{onRecord=()=>{},onProgress=()=>{}}={}){
  const page=await getPage(source.url),links=parseInriaList(page.body,page.finalUrl);if(!links.length)throw new Error('listing_empty_or_changed');const records=[],errors=[];let excluded=0;
  for(const [i,hint]of links.entries()){try{const p=await getPage(hint.url);const r=parseInria(p.body,hint.url,source,p);if(r){records.push(r);await onRecord(r);}else excluded++;}catch(e){errors.push({url:hint.url,error:e.message});}if(i%20===0)onProgress({source:source.id,visited:i+1,discovered:links.length,accepted:records.length});}
  return {records,report:{id:source.id,pages:1,discovered:links.length,accepted:records.length,excluded,complete:true,errors,checkedAt:new Date().toISOString()}};
}
