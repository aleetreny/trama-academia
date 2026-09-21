import type {Opportunity,ProgrammeRecurrence,Stage} from './types';

export const RECURRENCE_CATEGORIES:Record<ProgrammeRecurrence['category'],string>={'summer-school':'Escuelas de verano','research-stay':'Estancias de investigación',funding:'Becas y convocatorias'};
export const RECURRENCE_FREQUENCIES:Record<ProgrammeRecurrence['frequency'],string>={annual:'Periodicidad anual documentada',editions:'Varias ediciones documentadas',rolling:'Admisión continua documentada'};
export const RECURRENCE_STATES:Record<ProgrammeRecurrence['editionState'],string>={past:'Convocatoria de referencia cerrada',announced:'Próxima edición anunciada',unknown:'Consultar próxima convocatoria'};
export type RecurringRecord=Pick<Opportunity,'id'|'title'|'institution'|'country'|'url'|'stage'|'eligibleStages'|'entry'|'verifiedAt'|'lastError'> & {recurrence:ProgrammeRecurrence};
export type RecurringFilters={q:string;category:string;stage:string;country:string;page:number};
export const recurringDefaults:RecurringFilters={q:'',category:'all',stage:'all',country:'all',page:1};
const stages:Stage[]=['grado','master','doctorado','postdoc','faculty'];
const normalise=(value:string)=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();

export function readRecurringFilters(query:URLSearchParams,countries:string[]):RecurringFilters{
 const category=query.get('tipo')||'all',stage=query.get('etapa')||'all',country=query.get('pais')||'all';
 const page=Number(query.get('pagina')||1);
 return {q:(query.get('q')||'').slice(0,200),category:Object.hasOwn(RECURRENCE_CATEGORIES,category)?category:'all',stage:stages.includes(stage as Stage)?stage:'all',country:countries.includes(country)?country:'all',page:Number.isSafeInteger(page)&&page>0?page:1};
}

export function recurringQuery(filters:RecurringFilters){
 const query=new URLSearchParams();
 if(filters.q)query.set('q',filters.q);
 if(filters.category!=='all')query.set('tipo',filters.category);
 if(filters.stage!=='all')query.set('etapa',filters.stage);
 if(filters.country!=='all')query.set('pais',filters.country);
 if(filters.page>1)query.set('pagina',String(filters.page));
 return query;
}

export function selectRecurringRecords(records:RecurringRecord[],filters:RecurringFilters){
 const terms=normalise(filters.q).trim().split(/\s+/).filter(Boolean);
 return records.filter(record=>{
  if(filters.category!=='all'&&record.recurrence.category!==filters.category)return false;
  if(filters.stage!=='all'&&!(record.eligibleStages||[record.stage]).includes(filters.stage as Stage))return false;
  if(filters.country!=='all'&&record.country!==filters.country)return false;
  const text=normalise([record.title,record.institution,record.entry,record.recurrence.calendar].join(' '));
  return terms.every(term=>text.includes(term));
 }).sort((a,b)=>a.title.localeCompare(b.title,'es'));
}
