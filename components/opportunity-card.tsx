import Link from '@/components/site-link';
import {ResearchBadge} from './research-badge';
import type {ResearchInstitution} from '@/lib/search';
import {ArrowUpRight,MapPin,CalendarDays} from 'lucide-react';
import {Checkbox} from '@/components/ui/checkbox';
import {funderCountryLabel,STAGES,destinationLabel,dateLabel,statusOf,STATUS_NAMES,type Opportunity} from '@/lib/types';
import {SaveOpportunityButton} from './saved-opportunities';
import {opportunityHref} from '@/lib/return-path';
export function OpportunityCard({record:r,selected=false,onCompare,compareDisabled=false,loading=false,unavailable=false,research,subject,returnHref}:{record:Pick<Opportunity,'id'|'kind'|'status'|'deadline'|'lastError'|'verifiedAt'|'institution'|'title'|'city'|'country'|'funderCountry'|'destinationCountries'|'stage'|'fields'|'funding'|'entry'|'recurrence'>;loading?:boolean;unavailable?:boolean;research?:ResearchInstitution;subject?:string;selected?:boolean;compareDisabled?:boolean;returnHref?:string;onCompare?:(id:string)=>void}){const status=statusOf(r);const href=opportunityHref(r.id,returnHref);return <article className="opportunity-card">
 <div className="opportunity-top"><span className={'status-label status-'+status}>{STATUS_NAMES[status]}</span><span className="record-kind">{r.kind.includes('funding')?'Financiación':r.kind==='programme'?'Programa':'Vacante'}</span></div>
 <p className="institution">{r.institution}</p>{subject&&<ResearchBadge institution={research} subject={subject}/>}<h3><Link href={href}>{r.title}<ArrowUpRight size={19}/></Link></h3>
 <div className="location"><MapPin size={14}/>{r.city?r.city+' · ':''}{destinationLabel(r)}<span className="small-divider">/</span>{r.recurrence?.category==='summer-school'?'Escuela de verano':STAGES.find(s=>s.id===r.stage)?.short}</div>
 {r.kind.includes('funding')&&r.funderCountry&&<p className="small muted">Entidad financiadora: {funderCountryLabel(r.funderCountry)}</p>}
 <div className="field-tags">{r.fields.map(f=><span key={f}>{f}</span>)}</div>
 {loading?<p className="record-loading">{unavailable?<>No se pudieron cargar las condiciones. <Link className="text-link" href={href}>Abrir ficha completa</Link>.</>:'Cargando condiciones…'}</p>:<div className="record-facts"><div><span>Financiación</span><strong>{r.funding.text}</strong></div><div><span>Nivel de entrada</span><strong>{r.entry}</strong></div></div>}
 <div className="opportunity-bottom"><span><CalendarDays size={14}/>{r.deadline?dateLabel(r.deadline):r.kind.includes('programme')?'Convocatoria: consultar fuente':'Sin fecha publicada'}</span></div>
 <div className="card-actions"><SaveOpportunityButton record={{id:r.id,title:r.title,institution:r.institution}} compact/>{onCompare&&<label className="compare-choice"><Checkbox disabled={compareDisabled} aria-label={'Comparar '+r.title} checked={selected} onCheckedChange={()=>onCompare(r.id)}/><span>Comparar</span></label>}</div>
 </article>}
