import raw from '@/data/institutions.json';
import {COUNTRY_NAMES} from '@/lib/types';
import {and,count,desc,eq,sql} from 'drizzle-orm';
import {getDb} from '@/db';
import {institutions,institutionEditions} from '@/db/schema';
import {institutionMetadata,institutionPriority,institutionSearchText} from '@/scripts/harvest/institution-summary.mjs';
export type ResearchMetric={openalexId:string|null;volume:number|null;impactTotal:number|null;impactEligible:number|null;top10:number|null;top10Share:number|null;impactCoverage:number|null;tier:string|null;reason:string|null;score?:number;percentile?:number;cohortSize?:number};
export type InstitutionSource={id:string;type:string;url:string;label:string;status:string;checkedAt:string|null;observedAt:string;contentHash:string|null;lastError:string|null};
export type Institution={id:string;ror:string|null;name:string;aliases:string[];country:string;city:string|null;officialUrl:string|null;geography:string;geographyNote?:string;reviewStatus:string;sources:InstitutionSource[];researchMetrics:Record<string,ResearchMetric>;crawl?:{queued:number;read:number;pending:number;documents:number;lastCheckedAt:string|null;complete:boolean}};
export type InstitutionRegistry={generatedAt:string;provenance:{url:string;releaseDate:string;version:string;license:string};scope:{countries:string[];transcontinental:string[]};institutions:Institution[];crawl?:{jobs:number;statuses:Record<string,number>;institutionsRead:number;updatedAt:string;lastRun:{attempted:number;read:number;failed:number;discovered:number}};research?:{generatedAt:string;status:string;activityWindow:number[];impactWindow:number[];workTypes?:string[];subjects:{id:string;name:string;taxonomy:string[];cohortSize:number;references:Record<string,{url:string;urls?:string[];checkedAt:string;pages:number;groups:number}>}[]}};
export type InstitutionMetadata=Omit<InstitutionRegistry,'institutions'>&{summary:{total:number;withSources:number;withCheckedSources:number;countriesWithSources:number;countries:Record<string,{total:number;withSources:number;withCheckedSources:number}>}};
export const registry=raw as unknown as InstitutionRegistry;
export const INSTITUTION_COUNTRIES:Record<string,string>={...COUNTRY_NAMES,BY:'Bielorrusia',RU:'Rusia',TR:'Turquía',KZ:'Kazajistán',VA:'Ciudad del Vaticano',AX:'Åland',FO:'Islas Feroe',GG:'Guernsey',GI:'Gibraltar',IM:'Isla de Man',JE:'Jersey',SJ:'Svalbard y Jan Mayen'};
export const RESEARCH_SUBJECTS=[{id:'cs',name:'Informática'},{id:'ml',name:'IA y aprendizaje automático'},{id:'statistics',name:'Estadística y probabilidad'},{id:'applied-math',name:'Matemáticas aplicadas'}];
export const normaliseInstitutionQuery=(s:string)=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
export const sourceKind:Record<string,string>={masters:'Másteres',phd:'Doctorados',funding:'Financiación',jobs:'Plazas',research:'Investigación'};

export type InstitutionFilters={q:string;country:string;scope:string;subject:string;tier:string;page:number};
const pagination=(total:number,wanted:number)=>{const pageCount=Math.max(1,Math.ceil(total/25)),page=Math.min(pageCount,Math.max(1,Number.isFinite(wanted)?Math.trunc(wanted):1));return {page,pageCount};};
export async function getInstitutionPage(filters:InstitutionFilters){
 const query=normaliseInstitutionQuery(filters.q),{country,scope,subject,tier}=filters;
 try{
  const db=getDb(),conditions=[];
  if(country)conditions.push(eq(institutions.country,country));
  if(query)conditions.push(sql`position(${query} in ${institutions.searchText}) > 0`);
  if(scope==='fuentes')conditions.push(eq(institutions.hasSources,true));else if(scope!=='todo')conditions.push(eq(institutions.priority,true));
  if(tier)conditions.push(tier==='pendiente'?sql`${institutions.payload}->'researchMetrics'->${subject}->>'tier' IS NULL`:sql`${institutions.payload}->'researchMetrics'->${subject}->>'tier' = ${tier}`);
  const where=and(...conditions);
  const [editions,totals]=await Promise.all([db.select({payload:institutionEditions.payload}).from(institutionEditions).where(eq(institutionEditions.id,'current')).limit(1),db.select({total:count()}).from(institutions).where(where)]);
  if(!editions[0])throw new Error('registry_not_published');
  const total=Number(totals[0].total),paging=pagination(total,filters.page);
  const result=await db.select({payload:institutions.payload}).from(institutions).where(where).orderBy(desc(institutions.hasSources),institutions.name,institutions.id).offset((paging.page-1)*25).limit(25);
  return {metadata:editions[0].payload as InstitutionMetadata,rows:result.map(x=>x.payload as Institution),total,...paging,mode:'live' as const};
 }catch{
  const rows=registry.institutions.filter(i=>(!country||i.country===country)&&(!query||institutionSearchText(i).includes(query))&&(scope==='todo'||(scope==='fuentes'?i.sources.length>0:institutionPriority(i)))&&(!tier||(tier==='pendiente'?!i.researchMetrics[subject]?.tier:i.researchMetrics[subject]?.tier===tier)));
  rows.sort((a,b)=>Number(Boolean(b.sources.length))-Number(Boolean(a.sources.length))||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
  const paging=pagination(rows.length,filters.page);
  return {metadata:institutionMetadata(registry) as InstitutionMetadata,rows:rows.slice((paging.page-1)*25,paging.page*25),total:rows.length,...paging,mode:'snapshot' as const};
 }
}
