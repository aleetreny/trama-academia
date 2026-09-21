'use client';
import {useEffect,useRef,useState} from 'react';
import Link from '@/components/site-link';
import {SaveOpportunityButton} from '@/components/saved-opportunities';
import {opportunityHref} from '@/lib/return-path';
import {ArrowUpRight,ArrowLeft,ArrowRight,Search} from 'lucide-react';
import {COUNTRY_NAMES,dateLabel} from '@/lib/types';
import {RECURRENCE_CATEGORIES,RECURRENCE_FREQUENCIES,RECURRENCE_STATES,readRecurringFilters,recurringDefaults,recurringQuery,selectRecurringRecords,type RecurringFilters,type RecurringRecord} from '@/lib/recurrence';

const pageSize=8;
const stageLabels={grado:'Grado',master:'Máster',doctorado:'Doctorado',postdoc:'Postdoctorado',faculty:'Carrera académica'};

export default function RecurringProgrammes({records}:{records:RecurringRecord[]}){
 const pageFocus=useRef(false),resultsHeading=useRef<HTMLDivElement>(null);
 const [filters,setFilters]=useState<RecurringFilters>(recurringDefaults),[ready,setReady]=useState(false);
 const countries=[...new Set(records.map(record=>record.country))].sort((a,b)=>(COUNTRY_NAMES[a]||a).localeCompare(COUNTRY_NAMES[b]||b,'es'));
 const countryKey=countries.join(',');
 useEffect(()=>{const sync=()=>{setFilters(readRecurringFilters(new URLSearchParams(location.search),countryKey.split(',')));setReady(true);};sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[countryKey]);
 const results=selectRecurringRecords(records,filters),pages=Math.max(1,Math.ceil(results.length/pageSize)),page=Math.min(filters.page,pages);
 useEffect(()=>{if(!ready)return;const query=recurringQuery({...filters,page}).toString();history.replaceState(null,'',location.pathname+(query?'?'+query:'')+location.hash);},[filters,page,ready]);
 const change=(key:keyof Omit<RecurringFilters,'page'>,value:string)=>setFilters(previous=>({...previous,[key]:value,page:1}));
 useEffect(()=>{if(pageFocus.current){pageFocus.current=false;resultsHeading.current?.focus({preventScroll:true});resultsHeading.current?.scrollIntoView({block:'start'});}},[page]);
 const turnPage=(next:number)=>{pageFocus.current=true;setFilters(previous=>({...previous,page:next}));};
 const returnQuery=recurringQuery({...filters,page}).toString();
 const returnHref='/programas'+(returnQuery?'?'+returnQuery:'');
 const filtered=filters.q!==''||filters.category!=='all'||filters.stage!=='all'||filters.country!=='all';
 return <section aria-label="Directorio de programas recurrentes">
  <div className="recurring-filters" id="programas-filtros">
   <label className="filter-choice recurring-search"><span>Buscar programa o institución</span><div><Search size={18} aria-hidden="true"/><input type="search" value={filters.q} onChange={e=>change('q',e.target.value)} placeholder="Por ejemplo, ProbAI" maxLength={200}/></div></label>
   <label className="filter-choice"><span>Tipo de experiencia</span><select value={filters.category} onChange={e=>change('category',e.target.value)}><option value="all">Todos los tipos</option>{Object.entries(RECURRENCE_CATEGORIES).map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label>
   <label className="filter-choice"><span>Nivel de acceso</span><select value={filters.stage} onChange={e=>change('stage',e.target.value)}><option value="all">Todos los niveles</option>{Object.entries(stageLabels).map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label>
   <label className="filter-choice"><span>País de la edición documentada</span><select value={filters.country} onChange={e=>change('country',e.target.value)}><option value="all">Todos los países</option>{countries.map(country=><option value={country} key={country}>{COUNTRY_NAMES[country]||country}</option>)}</select></label>
  </div>
  <p className="recurring-filter-note">El nivel indica quién puede solicitar, sujeto a los requisitos de cada ficha. Las escuelas itinerantes pueden cambiar de país. Los filtros se guardan en la dirección para compartirlos.</p>
  <div className="recurring-results-heading" id="programas-resultados" ref={resultsHeading} tabIndex={-1}><p role="status" aria-live="polite"><strong>{results.length}</strong> {results.length===1?'programa':'programas'}{results.length>pageSize?` · página ${page} de ${pages}`:''}</p><button type="button" className="text-link" disabled={!filtered&&page===1} onClick={()=>setFilters({...recurringDefaults})}>Restablecer filtros</button></div>
  {results.length===0?<div className="recurring-empty"><h2>No hay programas con esta combinación.</h2><p>Prueba otro país o nivel de acceso, o elimina los filtros.</p><button type="button" className="primary-button" onClick={()=>setFilters({...recurringDefaults})}>Ver todos los programas</button></div>:<div className="recurring-list">{results.slice((page-1)*pageSize,page*pageSize).map(record=><article className="recurring-item" key={record.id}>
   <div className="recurring-identity"><p className="eyebrow">{RECURRENCE_CATEGORIES[record.recurrence.category]} · {COUNTRY_NAMES[record.country]||record.country}</p><h2><Link href={opportunityHref(record.id,returnHref)}>{record.title}<ArrowUpRight size={19} aria-hidden="true"/></Link></h2><p className="institution">{record.institution}</p><p className="recurring-entry">{record.entry}</p><div className="recurring-links"><SaveOpportunityButton record={{id:record.id,title:record.title,institution:record.institution}}/><Link className="text-link" href={opportunityHref(record.id,returnHref)}>Requisitos, costes y evidencia <ArrowRight size={15} aria-hidden="true"/></Link><a href={record.url} target="_blank" rel="noreferrer">Fuente oficial <ArrowUpRight size={15} aria-hidden="true"/><span className="sr-only"> (se abre en otra pestaña)</span></a></div></div>
   <div className="recurring-calendar"><p className="recurring-edition"><strong>Referencia: {record.recurrence.edition}</strong><span>{record.lastError?'Información por revalidar':RECURRENCE_STATES[record.recurrence.editionState]}</span></p><p>{record.recurrence.calendar}</p><p className="recurring-frequency">{RECURRENCE_FREQUENCIES[record.recurrence.frequency]}</p><p className="recurring-note">{record.recurrence.note}</p><small>{record.lastError?'Última comprobación válida':'Fuentes comprobadas'}: {dateLabel(record.verifiedAt)}</small></div>
  </article>)}</div>}
  {pages>1&&<nav className="recurring-pagination" aria-label="Páginas de programas"><button type="button" disabled={page===1} onClick={()=>turnPage(page-1)}><ArrowLeft size={16} aria-hidden="true"/> Anterior</button><span>Página {page} de {pages}</span><button type="button" disabled={page===pages} onClick={()=>turnPage(page+1)}>Siguiente <ArrowRight size={16} aria-hidden="true"/></button></nav>}
  <noscript><p>Activa JavaScript para filtrar y recorrer este directorio. Las fichas enlazadas incluyen toda la información sin filtros.</p></noscript>
 </section>;
}
