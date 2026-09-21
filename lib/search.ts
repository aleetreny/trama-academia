import {COUNTRY_NAMES,FIELDS,STAGES,statusOf,type Opportunity} from './types.ts';
export const SUBJECTS=[['cs','Informática'],['ml','IA y aprendizaje automático'],['statistics','Estadística y probabilidad'],['applied-math','Matemáticas aplicadas']] as const;
export type ResearchMetric={tier:string|null;score:number|null;volume:number|null;top10Share:number|null;impactEligible:number|null;impactCoverage:number|null;openalexId:string|null;reason:string|null};
export type ResearchInstitution={id:string;name:string;ror:string|null;metrics:Record<string,ResearchMetric>};
export type SearchRecord=Pick<Opportunity,'id'|'title'|'institution'|'country'|'city'|'kind'|'stage'|'eligibleStages'|'fields'|'status'|'verifiedAt'|'deadline'|'languages'|'lastError'>&{funding:{kind:string};researchInstitutionId:string|null;detailPath:string};
export type SearchData={generatedAt:string|null;researchGeneratedAt:string|null;records:SearchRecord[];institutions:Record<string,ResearchInstitution>};
export type Filters={stage:string;q:string;country:string;field:string;kind:string;status:string;subject:string;tier:string;funding:string;language:string;closing:string;sort:string;page:number};
export const defaults:Filters={stage:'all',q:'',country:'all',field:'all',kind:'all',status:'current',subject:'cs',tier:'all',funding:'all',language:'all',closing:'all',sort:'prestige',page:1};
const keys:Record<keyof Filters,string>={stage:'etapa',q:'q',country:'pais',field:'campo',kind:'tipo',status:'vigencia',subject:'disciplina',tier:'tier',funding:'financiacion',language:'idioma',closing:'cierre',sort:'orden',page:'pagina'};
const choices:Partial<Record<keyof Filters,readonly string[]>>={stage:['all',...STAGES.map(s=>s.id)],country:['all',...Object.keys(COUNTRY_NAMES)],field:['all',...FIELDS],kind:['all','programme','master-programme','position'],status:['current','all','open','rolling','listed','programme','unverified','closed'],subject:SUBJECTS.map(s=>s[0]),tier:['all','ranked','T1','T1T2','T2','T3','T4','unranked'],funding:['all','salary','scholarship','waiver','grant','mixed','unconfirmed'],language:['all','english','spanish','french','german'],closing:['all','7','30','90'],sort:['prestige','impact','volume','deadline','recent','institution','title']};
export function readFilters(params:URLSearchParams):Filters{const f={...defaults};for(const [key,param] of Object.entries(keys)){const value=params.get(param);if(value===null)continue;if(key==='q')f.q=value.slice(0,200);else if(key==='page'){const p=Number(value);f.page=Number.isSafeInteger(p)&&p>0?p:1;}else if(choices[key as keyof Filters]?.includes(value))(f as unknown as Record<string,unknown>)[key]=value;}return f;}
export function filterQuery(f:Filters){const q=new URLSearchParams();for(const [k,param] of Object.entries(keys)){const key=k as keyof Filters;if(f[key]!==defaults[key])q.set(param,String(f[key]));}return q;}
export const normaliseSearch=(s:string)=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
export const recordStatus=(r:SearchRecord,now=Date.now())=>statusOf(r,now);
export function researchMetric(r:SearchRecord,data:SearchData,subject:string){return r.researchInstitutionId?data.institutions[r.researchInstitutionId]?.metrics[subject]:undefined;}
export const isRanked=(m:ResearchMetric|undefined)=>Boolean(m?.tier&&Number.isFinite(m.score));
const fundingGroups:Record<string,string[]>={salary:['salary','employment'],scholarship:['scholarship','partial-scholarship','allowance'],waiver:['tuition-waiver','tuition','fee-waiver'],grant:['grant','mobility-grant','research-grant','project-grant'],mixed:['mixed'],unconfirmed:['unconfirmed']};
const languagePatterns:Record<string,RegExp>={english:/\b(ingles|english)\b/,spanish:/\b(espanol|castellano|spanish)\b/,french:/\b(frances|french)\b/,german:/\b(aleman|german|deutsch)\b/};
export function selectRecords(data:SearchData,f:Filters,now=Date.now()){
 const words=normaliseSearch(f.q.trim()).split(/\s+/).filter(Boolean);
 const rows=data.records.filter(r=>{
  const status=recordStatus(r,now),m=researchMetric(r,data,f.subject),ranked=isRanked(m);
  if(f.stage!=='all'&&r.stage!==f.stage&&!r.eligibleStages?.includes(f.stage as Opportunity['stage']))return false;
  if(f.country!=='all'&&r.country!==f.country||f.field!=='all'&&!r.fields.includes(f.field))return false;
  if(words.length){const text=normaliseSearch([r.title,r.institution,r.city,COUNTRY_NAMES[r.country],...r.fields].join(' '));if(!words.every(w=>text.includes(w)))return false;}
  if(f.kind!=='all'&&(f.kind==='master-programme'?r.kind!=='programme'||r.stage!=='master':f.kind==='programme'?!r.kind.includes('programme'):r.kind!=='position'))return false;
  if(f.status!=='all'&&(f.status==='current'?['closed','unverified'].includes(status):status!==f.status))return false;
  if(f.tier==='ranked'&&!ranked||f.tier==='unranked'&&ranked||f.tier==='T1T2'&&!['T1','T2'].includes(m?.tier||'')||/^T[1-4]$/.test(f.tier)&&m?.tier!==f.tier)return false;
  if(f.funding!=='all'&&!fundingGroups[f.funding]?.includes(r.funding.kind))return false;
  if(f.language!=='all'&&!languagePatterns[f.language]?.test(normaliseSearch(r.languages.join(' '))))return false;
  if(f.closing!=='all'){const deadline=Date.parse(r.deadline?.length===10?r.deadline+'T23:59:59Z':r.deadline||'');if(!Number.isFinite(deadline)||deadline<now||deadline>now+Number(f.closing)*86400000)return false;}
  return true;
 });
 return rows.sort((a,b)=>{
  let d=0;
  if(['prestige','impact','volume'].includes(f.sort)){const am=researchMetric(a,data,f.subject),bm=researchMetric(b,data,f.subject);d=Number(isRanked(bm))-Number(isRanked(am));if(!d&&isRanked(am)&&isRanked(bm)){const key=f.sort==='impact'?'top10Share':f.sort==='volume'?'volume':'score';d=(bm?.[key]??0)-(am?.[key]??0);}}
  else if(f.sort==='recent')d=(Date.parse(b.verifiedAt||'')||0)-(Date.parse(a.verifiedAt||'')||0);
  else if(f.sort==='institution')d=a.institution.localeCompare(b.institution,'es');
  else if(f.sort==='deadline'){const av=Date.parse(a.deadline||''),bv=Date.parse(b.deadline||'');d=(Number.isFinite(av)?av:Infinity)-(Number.isFinite(bv)?bv:Infinity);}
  return (Number.isNaN(d)?0:d)||a.title.localeCompare(b.title,'es')||a.id.localeCompare(b.id);
 });
}
