import Link from './site-link';
import {SUBJECTS,isRanked,type ResearchInstitution} from '@/lib/search';
export function ResearchBadge({institution,subject}:{institution?:ResearchInstitution;subject:string}){
 const m=institution?.metrics[subject],name=SUBJECTS.find(s=>s[0]===subject)?.[1];
 return <details className="research-badge"><summary>{isRanked(m)?<><b>{m!.tier}</b> {name} <span>Índice {m!.score!.toFixed(1)}</span></>:<>Sin tier en {name}</>}</summary><div>
  <p>Prestigio investigador orientativo de la institución en esta disciplina. No valora un programa o supervisor concreto.</p>
  {institution&&<p><strong>{institution.name}</strong></p>}
  {isRanked(m)?<p>{m!.volume?.toLocaleString('es-ES')} publicaciones en 2020–2024; {((m!.top10Share??0)*100).toFixed(1)} % entre el 10 % más citado, sobre {m!.impactEligible} trabajos de 2020–2022. Índice de actividad e impacto: {m!.score!.toFixed(1)}/100.</p>:<p>{institution?'La muestra o la cobertura no permiten asignar un tier en esta disciplina.':'La identidad institucional no tiene una correspondencia inequívoca en esta edición.'} La ausencia de datos no es una valoración baja.</p>}
  {m?.openalexId&&<a href={m.openalexId} target="_blank" rel="noreferrer">Registro OpenAlex ↗</a>}{institution?.ror&&<> · <a href={institution.ror} target="_blank" rel="noreferrer">Identidad ROR ↗</a></>}
  <p><Link href={'/instituciones?disciplina='+subject+'#metodo-tiers'}>Método, umbrales y fuentes ↗</Link></p>
 </div></details>;
}
