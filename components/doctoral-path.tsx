'use client';

import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {ArrowUpRight,Download,Check} from 'lucide-react';
import Link from './site-link';
import {AIMS,MOBILITY,PATH_FIELDS,SITUATIONS,PATH_KEY,createPathStore,emptyPath,pathActions,pathSearches,profileLabel,type PathProfile} from '@/lib/doctoral-path';
import './doctoral-path.css';

const store=createPathStore(()=>window.localStorage);
let subscriptions=0;
function storageChanged(event:StorageEvent){if(event.key===PATH_KEY||event.key===null)store.reload();}
function subscribe(listener:()=>void){
  const remove=store.subscribe(listener);
  if(subscriptions++===0)window.addEventListener('storage',storageChanged);
  store.initialize();
  return()=>{remove();if(--subscriptions===0)window.removeEventListener('storage',storageChanged);};
}
export function useDoctoralPath(){return useSyncExternalStore(subscribe,store.getSnapshot,()=>emptyPath);}
export function PathContext(){
  const {ready,configured,data}=useDoctoralPath();
  return <aside className="path-context"><span>{ready&&configured?<><strong>Tu punto de partida:</strong> {profileLabel('situation',data.profile.situation)}. {profileLabel('mobility',data.profile.mobility)}. Las búsquedas tienen sus propios filtros.</>:'Organiza tus próximos pasos hacia el doctorado desde España.'}</span><Link href="/mi-camino">Ajustar mi camino <ArrowUpRight size={15}/></Link></aside>;
}
export default function DoctoralPath(){
  const {ready,data,warning}=useDoctoralPath();
  const incoming=useRef(false);
  useEffect(()=>{if(!ready||incoming.current)return;incoming.current=true;const url=new URL(location.href);const situation=url.searchParams.get('situacion');if(SITUATIONS.some(([id])=>id===situation)){const aim=url.searchParams.get('objetivo');store.change({situation:situation as PathProfile['situation'],...(AIMS.some(([id])=>id===aim)?{aim:aim as PathProfile['aim']}:{})});url.searchParams.delete('situacion');url.searchParams.delete('objetivo');history.replaceState(null,'',url);}},[ready]);
  const [resetting,setResetting]=useState(false);
  const [downloadError,setDownloadError]=useState(false);
  const actions=pathActions(data.profile),searches=pathSearches(data.profile);
  const done=actions.filter(action=>data.completed.includes(action.id)).length;
  function download(){
    try{
      const text=['MI CAMINO HACIA EL DOCTORADO · TRAMA','Plan personal de preparación; no acredita elegibilidad.',...(['situation','aim','mobility','field'] as const).map(key=>profileLabel(key,data.profile[key])), '',...actions.map(action=>`${data.completed.includes(action.id)?'[x]':'[ ]'} ${action.title}\n${action.body}`),'','Búsquedas y condiciones actuales: https://aleetreny.github.io/trama-academia/mi-camino/'].join('\n\n');
      const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
      const link=document.createElement('a');link.href=url;link.download='trama-mi-camino.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setDownloadError(false);
    }catch{setDownloadError(true);}
  }
  return <div className="path-layout">
    <div className="path-settings">
      <h2>Empieza donde estás.</h2><p>Cuatro decisiones para ordenar el siguiente paso. Puedes cambiarlas cuando quieras.</p>
      <fieldset disabled={!ready}>
        <legend className="sr-only">Tu situación y preferencias</legend>
        {([['situation','Tu situación',SITUATIONS],['aim','Lo que necesitas ahora',AIMS],['mobility','Tu movilidad',MOBILITY],['field','Tu área',PATH_FIELDS]] as const).map(([key,label,options])=><label key={key} className="path-choice"><span>{label}</span><select value={data.profile[key]} onChange={event=>store.change({[key]:event.target.value} as Partial<PathProfile>)}>{options.map(([id,text])=><option key={id} value={id}>{text}</option>)}</select></label>)}
      </fieldset>
      <p className="path-privacy">El plan y las casillas se guardan solo en este navegador. No pedimos nombre, expediente ni nacionalidad. No se sincronizan entre dispositivos.</p>
      {warning&&<p className="notice" role="status">{warning}</p>}
      <div className="path-tools"><button onClick={download} disabled={!ready}><Download size={16}/> Descargar mi plan</button><button onClick={()=>setResetting(true)} disabled={!ready}>Reiniciar plan</button></div>
      {downloadError&&<p role="alert">No se pudo descargar. Puedes copiar los pasos de esta página.</p>}
      {resetting&&<div className="path-reset"><p>Se restablecerán tus preferencias y casillas. Tu lista de oportunidades guardadas se conserva.</p><button onClick={()=>{store.reset();setResetting(false);}}>Sí, reiniciar el plan</button><button onClick={()=>setResetting(false)}>Cancelar</button></div>}
    </div>
    <div className="path-results">
      <section aria-labelledby="next-steps">
        <div className="path-results-heading"><div><p className="eyebrow">UNA RUTA QUE PUEDES AJUSTAR</p><h2 id="next-steps">Tus próximos pasos</h2></div><p aria-live="polite">{done} de {actions.length}<br/><span>pasos marcados</span></p></div>
        <p className="path-explanation">{data.profile.aim==='decidir'?'Empieza por probar cómo se investiga y contrastar la vida cotidiana de un grupo. Decidir que no quieres un doctorado también es una conclusión útil.':data.profile.aim==='experiencia'?'Prioriza una experiencia supervisada y una muestra que explique cómo piensas. Acumular cursos sin una pregunta o una evaluación no tiene por qué mejorar tu candidatura.':'Trabaja en paralelo en el encaje con el grupo, el acceso académico y la financiación. Cada proceso puede tener una solicitud y un plazo propios.'}</p>
        <ol className="path-checklist">{actions.map((action,index)=>{
          const completed=data.completed.includes(action.id);
          return <li key={action.id} className={completed?'is-complete':''}><label><input type="checkbox" disabled={!ready} checked={completed} onChange={event=>store.complete(action.id,event.target.checked)}/><span className="path-step-number" aria-hidden="true">{completed?<Check size={17}/>:String(index+1).padStart(2,'0')}</span><strong>{action.title}</strong></label><p>{action.body}</p><Link href={action.href}>{action.link} <ArrowUpRight size={15}/></Link></li>;
        })}</ol>
      </section>
      <section className="path-searches" aria-labelledby="path-searches-title"><p className="eyebrow">DEL PLAN A LAS OPORTUNIDADES</p><h2 id="path-searches-title">Búsquedas para empezar</h2><p>Aplicamos etapa{data.profile.mobility==='espana'?', destino España':''}{data.profile.field!=='all'?' y tu área cuando corresponde':''}. {data.profile.mobility==='duda'?'Dejamos los destinos abiertos hasta que decidas tu movilidad. ':''}Podrás cambiar todos los filtros; estos enlaces no comprueban tus requisitos personales.</p><div>{searches.map(search=><Link className="path-search" key={search.title} href={search.href}><h3>{search.title}<ArrowUpRight size={19}/></h3><p>{search.body}</p></Link>)}</div></section>
      <section className="path-selection"><h2>Un plan. Una lista corta.</h2><p>Guarda las fichas que te interesan, compara sus condiciones y consulta su fuente oficial antes de solicitar. Tu selección se mantiene aunque ajustes este plan.</p><Link className="primary-button" href="/seleccion">Ver mi selección <ArrowUpRight size={17}/></Link><Link className="text-link" href="/doctorado-en-espana">Leer la guía completa desde España ↗</Link></section>
    </div>
  </div>;
}
