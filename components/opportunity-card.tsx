import Link from '@/components/site-link';
import {ResearchBadge} from './research-badge';
import type {ResearchInstitution} from '@/lib/search';
import {ArrowUpRight,MapPin,CalendarDays} from 'lucide-react';
import {Checkbox} from '@/components/ui/checkbox';
import {COUNTRY_NAMES,STAGES,dateLabel,statusOf,STATUS_NAMES,type Opportunity} from '@/lib/types';
export function OpportunityCard({record:r,selected=false,onCompare,compareDisabled=false,loading=false,research,subject}:{record:Pick<Opportunity,'id'|'kind'|'status'|'deadline'|'lastError'|'verifiedAt'|'institution'|'title'|'city'|'country'|'stage'|'fields'|'funding'|'entry'>;loading?:boolean;research?:ResearchInstitution;subject?:string;selected?:boolean;compareDisabled?:boolean;onCompare?:(id:string)=>void}){const status=statusOf(r);return <article className="opportunity-card">
 <div className="opportunity-top"><span className={'status-label status-'+status}>{STATUS_NAMES[status]}</span><span className="record-kind">{r.kind.includes('funding')?'Financiación':r.kind==='programme'?'Programa':'Vacante'}</span></div>
 <p className="institution">{r.institution}</p>{subject&&<ResearchBadge institution={research} subject={subject}/>}<h3><Link href={'/oportunidad/'+r.id}>{r.title}<ArrowUpRight size={19}/></Link></h3>
 <div className="location"><MapPin size={14}/>{r.city?r.city+' · ':''}{COUNTRY_NAMES[r.country]||r.country}<span className="small-divider">/</span>{STAGES.find(s=>s.id===r.stage)?.short}</div>
 <div className="field-tags">{r.fields.map(f=><span key={f}>{f}</span>)}</div>
 {loading?<p className="record-loading">Cargando condiciones…</p>:<div className="record-facts"><div><span>Financiación</span><strong>{r.funding.text}</strong></div><div><span>Nivel de entrada</span><strong>{r.entry}</strong></div></div>}
 <div className="opportunity-bottom"><span><CalendarDays size={14}/>{r.deadline?dateLabel(r.deadline):r.kind==='programme'?'Admisión: consultar fuente':'Sin fecha publicada'}</span>{onCompare&&<label className="compare-choice"><Checkbox disabled={compareDisabled} aria-label={'Comparar '+r.title} checked={selected} onCheckedChange={()=>onCompare(r.id)}/><span>Comparar</span></label>}</div>
 </article>}
