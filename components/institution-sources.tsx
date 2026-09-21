'use client';
import {useState} from 'react';
import {readJson} from '@/lib/web-data';
import {sourceKind,type InstitutionSource} from '@/lib/institutions';
import {dateLabel} from '@/lib/types';
export function InstitutionSources({path}:{path:string}){
 const [sources,setSources]=useState<InstitutionSource[]|null>(null),[error,setError]=useState(false);
 const load=async()=>{try{setSources(await readJson<InstitutionSource[]>(path));setError(false);}catch{setError(true);}};
 return <details className="institution-source-details" onToggle={e=>{if(e.currentTarget.open&&!sources)void load();}}><summary>Consultar las fuentes de esta institución</summary>{error?<p>No se pudieron cargar las fuentes. <button className="text-link" onClick={()=>void load()}>Reintentar</button></p>:sources?<ul>{sources.map(s=><li key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.label||sourceKind[s.type]||s.type} ↗</a><span>{sourceKind[s.type]||s.type} · {s.status==='checked'?'Leída el '+dateLabel(s.checkedAt):s.status==='access-pending'?'Acceso pendiente':'Pendiente de lectura'}</span></li>)}</ul>:<p role="status">Cargando fuentes…</p>}</details>;
}
