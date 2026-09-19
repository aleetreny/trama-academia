import {getPage} from './http.mjs';
import {clean,idFor,stageFrom,effectiveStatus} from './domain.mjs';
import {nordicDate,researchFields} from './nordic-adapters.mjs';

// Public endpoint used by https://www.jobbnorge.no/search/en itself.
export const JOBBNORGE_FEED='https://publicapi.jobbnorge.no/v3/jobs?language=2';
export function parseJobbnorgeFeed(body){
 const data=JSON.parse(body);if(!Array.isArray(data.jobs)||!data.jobs.length)throw new Error('listing_structure_changed');
 return data.jobs;
}
export function parseJobbnorge(job,source,page){
 if(!job.id||!job.link||!job.locations?.length||job.locations.some(l=>l.isDomestic!==true))return null;
 const academic=/university|universitet|h[øö]gsk[ou]l|research institute|forskningsinstitutt/i.test(job.employer)||/^Vitenskap/i.test(job.jobType?.jobTypeGroup?.name||'');
 if(!academic)return null;
 const title=clean(job.title),stage=stageFrom(title),fields=researchFields(title,clean(job.summary));
 if(!stage||!fields.length)return null;
 const url=job.link;const location=job.locations.find(l=>l.isPrimary)||job.locations[0];const deadline=nordicDate(job.deadline);
 const record={id:idFor(url),kind:'position',stage,title,institution:clean(job.employer),country:'NO',city:location.area||location.municipality||null,url,applyUrl:url,sourceId:source.id,sourceName:source.name,verifiedAt:page.checkedAt,seenAt:page.checkedAt,status:/continuously/i.test(job.deadline)?'rolling':'listed',deadline,deadlinePrecision:deadline?'day':null,deadlineNote:'El portal publica la fecha. Confirma la hora y los requisitos en el anuncio completo.',fields,entry:'Consultar requisitos',contract:job.jobDuration||null,hours:job.jobScope||null,duration:null,languages:[],funding:{kind:'unconfirmed',text:'Importe y condiciones pendientes de verificar en el anuncio completo'},eligibilityNote:'Verificados: título, institución, ubicación, dedicación y plazo publicados por Jobbnorge. El texto completo de requisitos y financiación requiere comprobación en la convocatoria.',evidence:{contentHash:page.hash,checkedUrl:page.finalUrl,method:'official-vacancy-feed',sourceRecordId:String(job.id)}};
 record.status=effectiveStatus(record);return record;
}
export async function crawlJobbnorge(source,{onRecord=()=>{}}={}){
 const page=await getPage(JOBBNORGE_FEED),jobs=parseJobbnorgeFeed(page.body),records=[];
 for(const job of jobs){const record=parseJobbnorge(job,source,page);if(record){records.push(record);await onRecord(record);}}
 return {records,report:{id:source.id,pages:1,totalListings:jobs.length,discovered:jobs.length,accepted:records.length,excluded:jobs.length-records.length,complete:false,errors:[{error:'full_description_not_verified'}],checkedAt:page.checkedAt,note:'Public feed fully traversed. Full-text endpoints unavailable; generic titles and detailed eligibility still need verification. Norwegian workplaces required.'}};
}
