import {load} from 'cheerio';
import {getPage} from './http.mjs';
import {COUNTRIES,clean,idFor,canonicalUrl,fieldsFrom,stageFrom,entryLevel,requiredDegree,durationFrom,effectiveStatus} from './domain.mjs';

// Preserve paragraph boundaries so a department biography or a degree mentioned
// elsewhere in the advert cannot silently become the applicant's requirement.
function lines(root){
 const copy=root.clone();copy.find('script,style,nav,footer,[hidden]').remove();
 copy.find('br').replaceWith('\n');copy.find('p,li,h2,h3,h4').append('\n');copy.append('\n');
 return copy.text().split(/\n/).map(clean).filter(Boolean);
}
export function nordicDate(raw){
 const s=clean(raw);let m=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|$)/),y,month,d;
 if(m)[,y,month,d]=m;
 else {m=s.match(/^(\d{1,2})(?:\.|\s)(\d{1,2}|[A-Za-zåäö]+)(?:\.|\s)+(\d{4})$/i);if(!m)return null;[,d,month,y]=m;
 const names=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];if(!/^\d+$/.test(month)){const k=month.toLowerCase().slice(0,3);month=({maj:5,okt:10}[k]||names.indexOf(k)+1);}}
 const date=[y,String(month).padStart(2,'0'),String(d).padStart(2,'0')].join('-');
 return month>=1&&month<=12&&!Number.isNaN(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date?date:null;
}
function section($,root,heading){
 const h=root.find('h2,h3,h4').filter((_,e)=>heading.test(clean($(e).text()))).first();
 return h.length?clean(lines(h.nextUntil('h2,h3,h4')).join(' ')):'';
}
function qualifications(parts){
 const at=parts.findIndex(s=>/^(?:admission requirements|requirements\b|eligibility\b|qualifications\b|selection criteria|your (?:background|experience)|what we expect|who (?:we are looking|are you)|kvalifikation(?:er|s?krav)|behörighet)/i.test(s));
 const explicit=parts.filter(s=>/(?:candidates?|applicants?|you|appointee).{0,35}(?:must|should|need|hold|completed)|^We seek a master[’']?s? student|^Current enrollment/i.test(s));
 return [...(at>=0?parts.slice(at,at+12):[]),...explicit].join(' ');
}
function research(parts){
 const at=parts.findIndex(s=>/^(?:requirements\b|qualifications\b|selection criteria|your (?:background|experience)|who we are|what we offer|kvalifikation(?:er|s?krav)|behörighet|the appointee (?:is required|must)|according to the university.*regulations)/i.test(s));
 return parts.slice(0,at>=0?at:parts.length).filter(s=>!/^The (?:department|school|university).{0,80}(?:is an|conducts research|community|has \d)/i.test(s)).join(' ').slice(0,5000);
}
export function researchFields(title,subject){
 const fields=new Set(fieldsFrom(title));
 // Incidental use of CAD, databases, numerical equipment or statistics does not
 // make a laboratory/teaching vacancy a computer-science or statistics post.
 const signals=[['Machine learning',/machine[ -]learning|deep learning|neural network|foundation model|large language model|reinforcement learning|computer vision|natural language processing|maskinl[æä]ring/],['Ciencia de datos',/data science|data mining|data analytics|scientific computing|datavitenskap/],['Estadística',/statistical (?:model|inference|method)|probabilistic (?:model|inference|method)|bayesian|stochastic (?:process|model)|causal inference/],['Informática',/computer science|algorithm|software (?:engineering|verification|systems)|information (?:and coding )?theory|cybersecurity|distributed systems|computer graphics|human.computer interaction|datavetenskap|informatikk|quantum (?:computing|program)|program (?:verification|analysis|synthesis)|programming language|formal (?:method|verification)|network(?:ed)? systems/],['Matemáticas aplicadas',/applied math|numerical (?:method|analysis|model)|partial differential|inverse problem|mathematical model|optimization (?:algorithm|method)|optimisation (?:algorithm|method)|operations research|control theory/]];
 for(const [field,pattern]of signals)if(new RegExp(pattern.source,'i').test(subject))fields.add(field);
 return [...fields];
}
function makeRecord(source,url,page,{title,institution,country,city,body,subject,qualification,deadline,applyUrl,contract,hours,salary,duration,deadlineNote}){
 const stage=stageFrom(title,'',qualification),fields=researchFields(title,subject);
 if(!title||!stage||!fields.length||!Object.values(COUNTRIES).includes(country))return null;
 let entry=requiredDegree(qualification)||'Consultar requisitos';
 if(entry==='Consultar requisitos'&&qualification)entry=entryLevel(qualification);
 if(stage==='doctorado'&&entry==='Doctorado')entry=/master|second.cycle|240.*credits/i.test(qualification)?'Máster o formación equivalente':'Consultar requisitos';
 if(stage==='doctorado'&&entry==='Máster'&&/equivalent|240.*credits/i.test(qualification))entry='Máster o formación equivalente';
 if(/master[’']?s? thesis/i.test(title)&&/master[’']?s? student/i.test(qualification))entry='Estudiante de máster';
 else if(/current enrollment in or completion of a master/i.test(qualification))entry='Máster en curso o terminado';
 const r={id:idFor(url),kind:'position',stage,title,institution,country,city:city||null,url,applyUrl:applyUrl||url,sourceId:source.id,sourceName:source.name,verifiedAt:page.checkedAt,seenAt:page.checkedAt,status:applyUrl?'listed':'unverified',deadline,deadlinePrecision:deadline?'day':null,deadlineNote:deadlineNote||null,fields,entry,contract:contract||null,hours:hours||null,duration:duration||durationFrom(body),languages:[],funding:salary?{kind:'salary',text:salary,amount:null,currency:null,period:/month/i.test(salary)?'month':null}:{kind:'unconfirmed',text:'Importe y condiciones por confirmar en la convocatoria'},evidence:{contentHash:page.hash,checkedUrl:page.finalUrl,method:'official-vacancy-html'}};
 if(/(?:English.{0,60}(?:required|requirement)|(?:command|knowledge|proficiency|skills).{0,60}English|requirement for English)/i.test(qualification))r.languages=['Inglés; consultar nivel y acreditación'];
 if(/position has been filled|job is no longer available|annonsen är inte tillgänglig/i.test(body))r.status='closed';
 r.status=effectiveStatus(r);return r;
}
export function parseKth(html,url,source,page){
 const $=load(html),root=$('.details-main-col'),parts=lines(root),values={};
 $('.details-list').each((_,e)=>{values[clean($(e).children('b').text())]=clean($(e).children('p').text());});
 if(!root.length)throw new Error('vacancy_structure_changed');
 const qualification=section($,root,/^(Admission requirements|Qualifications|Eligibility)$/i)||qualifications(parts);
 const subject=section($,root,/^(Project description|Job description|Subject field|Duties)$/i)||research(parts);
 const body=parts.join(' '),title=clean($('h1').text());
 const duration=/new position as a doctoral student is for a maximum of one year/i.test(body)?'Contrato inicial de hasta 1 año; renovable. Doctorado: hasta 4 años a tiempo completo.':null;
 const r=makeRecord(source,url,page,{title,institution:'KTH Royal Institute of Technology',country:COUNTRIES[values.Country],city:values.Location,body,subject,qualification,deadline:nordicDate(values['Last application date']),applyUrl:$('a.applyButton').attr('href'),contract:values['Type of employment'],hours:[values['Contract type'],values['Full-time equivalent']].filter(Boolean).join(' · '),salary:values.Salary||null,duration,deadlineNote:/midnight, CET\/CEST/.test(body)?'La convocatoria fija el cierre a medianoche, hora CET/CEST. Confirma la hora en la fuente.':null});
 if(r&&/at least one year at DTU/i.test(body))r.eligibilityNote='Movilidad obligatoria: al menos un año en DTU (Dinamarca), distribuible en varias estancias.';
 return r;
}
export function parseAalto(html,url,source,page){
 const $=load(html),root=$('main .aalto-user-generated-content'),parts=lines(root),body=parts.join(' '),title=clean($('h1').first().text());
 if(!root.length)throw new Error('vacancy_structure_changed');
 const apply=$('main a[href]').map((_,e)=>$(e).attr('href')).get().find(h=>/\.myworkdayjobs\.com\/.*\/apply(?:\?|$)/.test(h));
 // Aalto's Workday vacancy link explicitly names the workplace; do not use the
 // university's postal address in the page footer to infer a job's country.
 const workplace=apply?.match(/\/job\/([^/]+)\//)?.[1];
 const country=workplace&&/(?:^|-)Finland(?:-|$)/i.test(workplace)?'FI':null;
 const info=$('.aalto-article__info-item').filter((_,e)=>clean($(e).find('h2').text())==='Application closes on').find('time');
 const q=qualifications(parts),salaryLine=parts.find(s=>/salar(?:y|ies)/i.test(s)&&/funded|pay scale|monthly|salary system/i.test(s));
 let salary=salaryLine?(/fully funded including salary and travel\/publication costs/i.test(salaryLine)?'Salario según la universidad anfitriona; incluye viajes y publicaciones.':'Salario según la convocatoria; cuantía individual por confirmar.'):null;
 const duration=/positions are for up to three years/i.test(body)?'Hasta 3 años; duración y fecha de inicio se negocian individualmente.':null;
 const r=makeRecord(source,url,page,{title,institution:'Aalto University',country,city:workplace?workplace.replace(/-Finland$/i,'').replaceAll('-',' '):null,body,subject:research(parts),qualification:q,deadline:nordicDate(clean(info.text())),applyUrl:apply,contract:null,hours:null,salary,duration,deadlineNote:info.length?'Se conserva la fecha visible. Confirma la hora en el texto de la convocatoria; el marcado automático puede discrepar.':null});
 if(r&&/employing university will be determined by the supervising professor/i.test(body)){r.institution='HIIT · Aalto University / University of Helsinki';r.city='Helsinki / Espoo';r.eligibilityNote='La universidad que contrata depende del supervisor. Se admite un doctorado que vaya a completarse antes de incorporarse.';}
 return r;
}
export function parseUppsala(html,url,source,page){
 const $=load(html),root=$('.job-vacancies-details-description'),parts=lines(root),body=parts.join(' '),v={};
 $('.job-vacancies-details-info-dl dt').each((_,e)=>{v[clean($(e).text()).replace(/:$/,'')]=clean($(e).next('dd').text());});
 if(!root.length)throw new Error('vacancy_structure_changed');
 const city=v.Town||v.Ort;const country=/^(Uppsala|Gotland|Visby)$/i.test(city||'')?'SE':null;
 return makeRecord(source,url,page,{title:clean($('h1').text()),institution:'Uppsala University',country,city,body,subject:research(parts),qualification:qualifications(parts),deadline:nordicDate(v['Last application date']||v['Sista ansökningsdag']),applyUrl:$('a[href]').map((_,e)=>$(e).attr('href')).get().find(h=>/^https:\/\/uu\.varbi\.com\/.*(?:jobID:|\/apply\/)/.test(h)),contract:v['Type of employment']||v.Anställningsform,hours:[v.Scope||v.Omfattning,v['Working hours']||v.Arbetstid].filter(Boolean).join(' · '),salary:v.Pay||v.Lön});
}
export function parseHelsinki(html,url,source,page){
 const $=load(html),root=$('.jobdescription'),parts=lines(root),body=parts.join(' ');
 if(!root.length)throw new Error('vacancy_structure_changed');
 const location=$('[itemprop="streetAddress"]').attr('content')||'',country=location.match(/,\s*([A-Z]{2})$/)?.[1];
 const raw=$('[itemprop="validThrough"]').attr('content'),parsed=raw?Date.parse(raw):NaN;
 // The visible advert specifies the cutoff. SuccessFactors can emit a different
 // UTC hour: retain day precision until both can be reconciled.
 const deadline=Number.isNaN(parsed)?null:new Date(parsed).toISOString().slice(0,10);
 const from=parts.findIndex(s=>/^About the position$/i.test(s));const subject=research(from>=0?parts.slice(from):parts);
 const pay=parts.find(s=>/salary/i.test(s)&&/monthly|gross|salary system/i.test(s));
 const apply=$('a[href]').filter((_,e)=>/^Apply now/i.test(clean($(e).text()))).first().attr('href');
 return makeRecord(source,url,page,{title:clean($('h1').first().text()),institution:'University of Helsinki',country,city:location.replace(/,\s*[A-Z]{2}$/,''),body,subject,qualification:qualifications(parts),deadline,applyUrl:apply?new URL(apply,page.finalUrl).href:null,salary:pay?'Salario según el sistema de las universidades finlandesas; consultar importe y complementos.':null,duration:body.match(/position is funded for (\d+ months)/i)?.[1]||null,deadlineNote:deadline?'Fecha del anuncio; confirma la hora de Helsinki en la convocatoria.':null});
}

export function parseUppsalaList(html){
 const $=load(html);for(const e of $('script:not([src])').toArray()){
  const s=$(e).text();if(!/AppRegistry\.registerInitialState/.test(s)||!s.includes('"categoryId":"jobVacancies"'))continue;
  try{const d=JSON.parse(s.slice(s.indexOf('{'),s.lastIndexOf('}')+1));if(Array.isArray(d.result?.hits)&&Number.isInteger(d.result.count))return d.result;}catch{}
 }
 throw new Error('listing_structure_changed');
}
export async function crawlNordic(source,{maxPages=1000,onRecord=()=>{},onProgress=()=>{}}={}){
 const parser={kth:parseKth,aalto:parseAalto,uppsala:parseUppsala,helsinki:parseHelsinki}[source.adapter];
 const records=[],errors=[],seen=new Set(),visited=new Set(),queue=[...(source.startUrls||[source.url])];let excluded=0,pages=0,totalListings=null,complete=true;
 while(queue.length&&pages<maxPages){
  const url=queue.shift();if(visited.has(canonicalUrl(url)))continue;visited.add(canonicalUrl(url));
  let p;try{p=await getPage(url);}catch(e){errors.push({url,error:e.message});complete=false;continue;}
  const $=load(p.body);let links=[];
  try{
   if(source.adapter==='uppsala'){
    const list=parseUppsalaList(p.body);totalListings=list.count;links=list.hits.map(r=>new URL(r.uri,p.finalUrl).href);
    // Uppsala's server-rendered start parameter returns all hits up to start+10.
    if(list.hits.length<list.count){const next=new URL(source.url);next.searchParams.set('start',String(list.hits.length));if(visited.has(canonicalUrl(next.href)))throw new Error('pagination_stalled');queue.push(next.href);}
   }else{
    const pattern={kth:/\/lediga-jobb\/\d+/,aalto:/^\/en\/open-positions\/.+/,helsinki:/^\/job\/.+\/\d+\//}[source.adapter];
    links=$('a[href]').map((_,e)=>$(e).attr('href')).get().filter(h=>pattern.test(h)).map(h=>new URL(h,p.finalUrl).href);
    const pagination=$('a[href]').map((_,e)=>$(e).attr('href')).get().filter(h=>source.adapter==='aalto'?/[?&]page=\d+/.test(h):source.adapter==='helsinki'?/[?&]startrow=\d+/.test(h):false);
    queue.push(...pagination.map(h=>{const next=new URL(h,p.finalUrl);if(source.adapter==='aalto'&&next.searchParams.get('page')==='0')next.searchParams.delete('page');return next.href;}));
   }
   if(!links.length)throw new Error('listing_structure_changed');pages++;
  }catch(e){errors.push({url,error:e.message});complete=false;continue;}
  for(const link of new Set(links)){
   if(seen.has(canonicalUrl(link)))continue;seen.add(canonicalUrl(link));
   try{const page=await getPage(link);const record=parser(page.body,link,source,page);if(record){records.push(record);await onRecord(record);}else excluded++;}catch(e){errors.push({url:link,error:e.message});}
   if(seen.size%10===0)onProgress({source:source.id,pages,visited:seen.size,accepted:records.length});
  }
 }
 if(queue.some(url=>!visited.has(canonicalUrl(url))))complete=false;
 if(totalListings!==null&&seen.size<totalListings)complete=false;
 return {records,report:{id:source.id,pages,discovered:seen.size,totalListings:totalListings??seen.size,accepted:records.length,excluded,complete,errors,checkedAt:new Date().toISOString(),note:'All accessible vacancy pages inspected, including generic researcher titles. Research subject and European workplace checked in each advert.'}};
}
