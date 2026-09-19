import {getPage} from './http.mjs';
import {extractPdfText} from './pdf.mjs';
import {clean,idFor,stageFrom,effectiveStatus,fieldsFrom} from './domain.mjs';
import {nordicDate,researchFields} from './nordic-adapters.mjs';

// Public endpoint and PDF export linked by Jobbnorge's own search/advert pages.
export const JOBBNORGE_FEED='https://publicapi.jobbnorge.no/v3/jobs?language=2';
export const jobbnorgePdfUrl=id=>`https://www.jobbnorge.no/en/available-jobs/joblisting/pdf/${id}`;
export function parseJobbnorgeFeed(body){
 const data=JSON.parse(body);if(!Array.isArray(data.jobs)||!data.jobs.length)throw new Error('listing_structure_changed');
 return data.jobs;
}
function domesticAcademic(job){
 return job.id&&job.link&&job.locations?.length&&job.locations.every(l=>l.isDomestic===true)&&(/university|universitet|h[øö]gsk[ou]l|research institute|forskningsinstitutt/i.test(job.employer)||/^Vitenskap/i.test(job.jobType?.jobTypeGroup?.name||''));
}
export function jobbnorgeCandidate(job){
 return Boolean(domesticAcademic(job)&&(stageFrom(job.title)||/research(?:er| scientist| engineer)|forsker|forskar|vitenskap|stipendiat|postdoktor|professor|førstelektor|høgskolelektor/i.test([job.title,job.jobType?.name,job.jobType?.jobTypeGroup?.name].join(' '))));
}
function baseRecord(job,source,page,stage,fields){
 const url=job.link,location=job.locations.find(l=>l.isPrimary)||job.locations[0],deadline=nordicDate(job.deadline);
 return {id:idFor(url),kind:'position',stage,title:clean(job.title),institution:clean(job.employer),country:'NO',city:location.area||location.municipality||null,url,applyUrl:url,sourceId:source.id,sourceName:source.name,verifiedAt:page.checkedAt,seenAt:page.checkedAt,status:/continuously/i.test(job.deadline)?'rolling':'listed',deadline,deadlinePrecision:deadline?'day':null,deadlineNote:'El portal publica la fecha. Confirma la hora en la convocatoria original.',fields,entry:'Consultar requisitos',contract:job.jobDuration||null,hours:job.jobScope||null,duration:null,languages:[],funding:{kind:'unconfirmed',text:'Importe y condiciones pendientes de verificar en el anuncio completo'},evidence:{contentHash:page.hash,checkedUrl:page.finalUrl,method:'official-vacancy-feed',sourceRecordId:String(job.id)}};
}
export function parseJobbnorge(job,source,page){
 if(!domesticAcademic(job))return null;
 const stage=stageFrom(job.title),fields=researchFields(clean(job.title),clean(job.summary));if(!stage||!fields.length)return null;
 const record=baseRecord(job,source,page,stage,fields);
 record.eligibilityNote='Verificados: título, institución, ubicación, dedicación y plazo publicados por Jobbnorge. El texto completo de requisitos y financiación requiere comprobación en la convocatoria.';
 record.status=effectiveStatus(record);return record;
}

function sectionKind(line){
 const s=clean(line).replace(/:$/,'');if(s.length>120)return null;
 if(/^(?:qualifications?\s*(?:\(requirements\)|\/requirements)|nødvendige kvalifikasjoner|vil du bli vår kollega krever vi)$/i.test(s))return 'requirements';
 if(/^(?:responsibilities|tasks and areas of responsibility|ansvars- og arbeidsområde|dine arbeidsoppgaver vil hovedsakelig være)$/i.test(s))return 'research';
 if(/^(?:ønskede kvalifikasjoner|personlige egenskaper|personlege eigenskapar|personal abilities|desirable qualifications(?: .*)?|favoured qualifications(?: .*)?|i tillegg er det ønskelig med|ønskede egenskaper)$/i.test(s))return 'other';
 if(/^(?:required (?:selection criteria|qualifications?)|qualifications?(?: and personal qualities| requirements)?|qualification requirements|formal requirements|what skills are important in this role\??|kvalifikasjonskrav|kvalifikasjon(?:ar|er)(?: og (?:eigenskapar|personlige egenskaper))?|kompetansekrav)$/i.test(s))return 'requirements';
 if(/^(?:about the (?:phd )?(?:position|project|research|job)(?:[ /-].*)?|job description|duties(?: of the position)?|research (?:area|topic|project)|om (?:stilling[ea]n|prosjektet)(?:[ /-].*)?|arbeidsoppg(?:åver|aver)(?: og ansvar)?)$/i.test(s))return 'research';
 if(/^(?:we (?:can )?offer(?: you)?|salary(?: and conditions)?|salary and working conditions|vi (?:kan )?tilby(?:r)?|l[øo]nn?(?: og (?:arbeidsvilkår|vilkår|tilsetjingsvilkår))?)$/i.test(s))return 'salary';
 if(/^(?:grade requirements|special requirements for the position|the position is subject to the following terms)$/i.test(s))return 'conditions';
 if(/^(?:preferred selection criteria|desired qualifications|personal (?:characteristics|skills|qualities)|personl(?:ege|ige) eig?enskapa?r?|research environment(?: .*)?|research environment & collaboration|diversity|we need different perspectives in our work|(?:about the |your |how to |the )?application(?: .*)?|application procedure|søknad(?:en)?(?: .*)?|general information|additional information|contact(?:s| persons?)?|about (?:the university|us).*)$/i.test(s))return 'other';
 return null;
}
export function jobbnorgeSections(text){
 const sections=[];let current={kind:'intro',lines:[]};sections.push(current);
 for(const raw of text.split('\n')){const line=clean(raw);if(!line)continue;const kind=sectionKind(line);if(kind){current={kind,heading:line,lines:[]};sections.push(current);}else current.lines.push(line);}
 const of=kind=>sections.filter(s=>s.kind===kind).map(s=>s.lines.join(' ')).join(' ');
 // Prefer the actual project/tasks over an introductory department biography.
 const specific=sections.filter(s=>s.kind==='research'&&!/^(?:about the position|om stilling[ea]n|duties of the position):?$/i.test(s.heading)&&!/Deleted if not applicable/i.test(s.lines.join(' ')));
 const duties=sections.filter(s=>/^Duties of the position:?$/i.test(s.heading||''));
 return {sections,research:specific.length?[...specific,...duties].map(s=>s.lines.join(' ')).join(' '):of('research'),qualification:of('requirements'),salary:sections.filter(s=>s.kind==='salary').flatMap(s=>s.lines).join('\n'),conditions:of('conditions')};
}
const sentences=text=>clean(text).split(/(?<=[.!?])\s+(?=[A-ZÆØÅ])/u);
const excerpt=(text,n=280)=>text.length<=n?text:text.slice(0,n).replace(/\s+\S*$/,'')+'…';
function salaryDetails(text){
 const lines=text.split('\n').map(clean),at=lines.findIndex(s=>/salary|løn|compensated/i.test(s)&&/(?:NOK|\bkr\b)\s*\d/i.test(s)),fallback=lines.findIndex(s=>/salary|løn|compensated/i.test(s));
 if(lines.length>1&&(at>=0||fallback>=0))text=lines.slice(at>=0?at:fallback,(at>=0?at:fallback)+6).join(' ');
 const parts=sentences(text),salary=parts.find(s=>/salary|løn|compensated/i.test(s)&&/(?:NOK|\bkr\b)\s*\d/i.test(s))||parts.find(s=>/salary|løn|compensated/i.test(s));
 if(!salary)return {kind:'unconfirmed',text:'Importe y condiciones por confirmar en la convocatoria'};
 const currency=/\bNOK\b|\bkr\b/i.test(salary)?'NOK':null,period=/annual|annum|per year|yearly|årsløn|per år|pr\.? år/i.test(salary)?'year':/per month|monthly|måned/i.test(salary)?'month':null;
 const matches=[...salary.matchAll(/\b\d{1,3}(?:[ ,.\u00a0]\d{3})+\b|\b\d{5,7}\b/g)].map(m=>Number(m[0].replace(/[ ,.\u00a0]/g,''))).filter(n=>n>10000);
 return {kind:'salary',text:excerpt(salary),amount:currency&&period&&matches.length===1?matches[0]:null,currency,period,gross:/gross|brutto/i.test(salary)};
}
function entryDetails(qualification,stage){
 const master=/master(?:[’'`]?s)?(?:grad| degree)?|\bMSc\b/i,doctoral=/doctoral degree|\bPh\.?D\b|doktorgrad/i;
 if(stage==='doctorado')return master.test(qualification)?(/equivalent|tilsvarand[ea]|tilsvarende/i.test(qualification)?'Máster o formación equivalente':'Máster'):'Consultar requisitos';
 if(doctoral.test(qualification))return 'Doctorado';if(master.test(qualification))return 'Máster';
 if(/bachelor|\bBSc\b/i.test(qualification))return 'Grado';return 'Consultar requisitos';
}
function durationDetails(text,contract){
 if(/permanent/i.test(contract||''))return 'Contrato permanente';
 const body=clean(text),number='(?:\\d+(?:[.,]\\d+)?|one|two|three|four|five|six|to|tre|fire)',time=new RegExp(number+'[ -]*(?:years?|months?|år|måneder|månadar)','i');
 const starts=/(?:The (?:total )?)?(?:(?:employment period|period of employment|fellowship period) (?:is|will be)|(?:position|fellowship) (?:is|will be) (?:available |announced )?for|appointment (?:is|will be) (?:for|a full-time position and is for))\b/gi;
 const duration=[...body.matchAll(starts)].map(m=>sentences(body.slice(m.index))[0]).find(s=>time.test(s));
 if(duration)return excerpt(duration,210);
 const fixed=clean(text).match(/(?:three-year|four-year|two-year|3-year|4-year) PhD Research Fellowship|PhD research fellow position \(\d+ years\)/i);
 if(fixed)return fixed[0];return null;
}
function fieldsInResearch(title,research){
 const titleFields=fieldsFrom(title);
 const fields=researchFields(title,research);
 if(/implicit neural representation|generative model|diffusion model/i.test(research)&&!fields.includes('Machine learning'))fields.push('Machine learning');
 if((/model.predictive control|adaptive control|optimal control/i.test(research)||/data assimilation|information fusion/i.test(title))&&!fields.includes('Matemáticas aplicadas'))fields.push('Matemáticas aplicadas');
 if(/reservoir computing|unconventional computing|non-von Neumann|computer architecture|digital sovereignty|digital infrastructures/i.test(research)&&!fields.includes('Informática'))fields.push('Informática');
 return fields.filter(field=>{
  if(titleFields.includes(field))return true;
  if(field==='Estadística')return /(?:develop\w*|design\w*|extend\w*|novel|new|theory of).{0,100}(?:statistic|probabili|bayes|stochastic)|(?:statistic|probabili|bayes|stochastic).{0,80}(?:methodological development|method development)/i.test(research);
  if(field==='Informática'&&/algorithm/i.test(research)&&!researchFields('',research.replace(/algorithm\w*/gi,'')).includes(field)&&!/digital sovereignty|digital infrastructures/i.test(research))return /(?:develop\w*|design\w*|extend\w*|improv\w*|new|novel).{0,100}algorithm|algorithm.{0,60}(?:develop|design|improv)/i.test(research);
  if(field==='Matemáticas aplicadas'&&/numerical model/i.test(research)&&!researchFields('',research.replace(/numerical model\w*/gi,'')).includes(field))return /(?:develop\w*|design\w*|extend\w*|improv\w*|new|novel).{0,100}numerical model|numerical model.{0,60}(?:develop|design|improv)/i.test(research);
  return true;
 });
}
function eligibilityDetails(qualification,conditions,body){
 const degree=sentences(qualification).find(s=>/master|doctoral degree|\bPh\.?D\b|doktorgrad|bachelor/i.test(s));
 const notes=[];if(degree)notes.push('Acceso (extracto): '+excerpt(degree,300));
 if(/must not have.{0,150}(?:resided|main activity).{0,120}12 months.{0,60}36 months/i.test(qualification))notes.push('Movilidad MSCA: máximo 12 meses de residencia o actividad principal en Noruega durante los 36 meses anteriores a la contratación.');
 if(/(?:master.{0,100}(?:must be|has to be).{0,100}before (?:starting|taking up)|master.{0,60}completed before)/i.test(qualification))notes.push('El máster debe estar terminado antes de incorporarse.');
 if(/external funding.{0,60}ceases.{0,200}termination/i.test(conditions))notes.push('La convocatoria prevé el posible fin del empleo si cesa su financiación externa.');
 else if(/position is conditional on external funding/i.test(body))notes.push('La plaza está condicionada a financiación externa.');
 const extension=sentences(body).find(s=>/extension of the appointment by up to twelve months/i.test(s));if(extension)notes.push('Posible ampliación de hasta 12 meses para tareas docentes; sujeta a las condiciones del anuncio.');
 return notes.join(' ')||undefined;
}
export function parseJobbnorgePdf(text,job,source,page,feedPage){
 if(!domesticAcademic(job))return null;
 if(text.match(/Jobbnorge ID:\s*(\d+)/)?.[1]!==String(job.id))throw new Error('pdf_identity_mismatch');
 const header=text.match(/Deadline:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/),feedDeadline=nordicDate(job.deadline);
 if(header&&feedDeadline&&nordicDate(`${header[3]}-${header[1].padStart(2,'0')}-${header[2].padStart(2,'0')}`)!==feedDeadline)throw new Error('pdf_deadline_conflict');
 const {research,qualification,salary,conditions}=jobbnorgeSections(text);
 if(!research&&!qualification)throw new Error('pdf_sections_unrecognized');
 let stage=stageFrom(job.title,'',qualification);
 if(!stage&&/forskar/i.test(job.title)&&/doktorgrad|Ph\.?D/i.test(qualification))stage='postdoc';
 if(stage==='postdoc'&&!/post.?doc|fellow|associate/i.test(job.title)&&/permanent/i.test(job.jobDuration||''))stage='faculty';
 const fields=fieldsInResearch(clean(job.title),research);if(!stage||!fields.length)return null;
 const record=baseRecord(job,source,page,stage,fields);record.seenAt=feedPage.checkedAt;
 record.entry=entryDetails(qualification,stage);record.duration=durationDetails(text,job.jobDuration);record.funding=salaryDetails(salary||text);
 record.eligibilityNote=eligibilityDetails(qualification,conditions,clean(text));
 if(/BRIDGE AI-Lab/.test(research)&&/one of our five research centers/i.test(research))record.researchNote='Esta ficha recoge la vía BRIDGE AI-Lab del anuncio, que integra modelos de lenguaje a escala en investigación de economía y finanzas. La convocatoria también ofrece otras líneas; comprueba el encaje con este centro y la titulación doctoral exigida.';
 if(/English|engelsk/i.test(qualification))record.languages.push('Inglés; consultar nivel y acreditación');
 if(/(?:fluency|fluent|learn|skills|knowledge|proficiency|command|ferdigheiter|ferdigheter|språk).{0,70}(?:Norwegian|norsk|Scandinavian)|(?:Norwegian|norsk|Scandinavian).{0,25}(?:language|skills|språk)/i.test(qualification))record.languages.push('Noruego o idioma escandinavo; consultar si se exige al entrar o durante el contrato');
 record.evidence={...record.evidence,method:'official-vacancy-pdf',feedUrl:feedPage.finalUrl,feedHash:feedPage.hash,feedCheckedAt:feedPage.checkedAt};
 record.status=effectiveStatus(record);return record;
}
export async function verifyJobbnorge(job,source,feedPage){
 const page=await getPage(jobbnorgePdfUrl(job.id),{format:'pdf'});return parseJobbnorgePdf(await extractPdfText(page),job,source,page,feedPage);
}
export function jobbnorgeFallback(job,source,page,previous,error){
 const record=previous?.evidence?.method==='official-vacancy-pdf'?{...previous,seenAt:page.checkedAt}:parseJobbnorge(job,source,page);
 if(!record)return null;record.lastError='pdf_'+error;record.lastAttemptAt=new Date().toISOString();record.status=effectiveStatus(record);return record;
}
export async function crawlJobbnorge(source,{onRecord=()=>{},onProgress=()=>{},knownRecord=()=>null}={}){
 const page=await getPage(JOBBNORGE_FEED),jobs=parseJobbnorgeFeed(page.body),candidates=jobs.filter(jobbnorgeCandidate),records=[],errors=[];let visited=0,excluded=0,fullTextVerified=0;
 for(const job of candidates){
  try{const record=await verifyJobbnorge(job,source,page);fullTextVerified++;if(record){records.push(record);await onRecord(record);}else excluded++;}
  catch(e){errors.push({url:jobbnorgePdfUrl(job.id),error:e.message});const record=jobbnorgeFallback(job,source,page,knownRecord(idFor(job.link)),e.message);if(record){records.push(record);await onRecord(record);}}
  visited++;if(visited%10===0)onProgress({source:source.id,visited,candidates:candidates.length,accepted:records.length,errors:errors.length});
 }
 return {records,report:{id:source.id,pages:1+visited,totalListings:jobs.length,discovered:jobs.length,candidates:candidates.length,fullTextVerified,accepted:records.length,excluded:jobs.length-candidates.length+excluded,complete:errors.length===0,errors,checkedAt:new Date().toISOString(),note:'Public feed fully traversed; academic candidates inspected through official PDF exports, including generic titles. Identity, deadline and Norwegian workplaces checked. Technical or unrecognized documents remain explicit failures.'}};
}
