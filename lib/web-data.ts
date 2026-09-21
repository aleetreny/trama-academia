import {assetPath} from './site-path.ts';
import type {Opportunity} from './types.ts';
const cache=new Map<string,Promise<unknown>>();
export async function readJson<T>(path:string,fresh=false):Promise<T>{
 if(!fresh&&cache.has(path))return cache.get(path) as Promise<T>;
 const task=fetch(assetPath(path),{signal:AbortSignal.timeout(20000),...(fresh?{cache:'no-cache' as const}:{})}).then(r=>{if(!r.ok)throw new Error('No se pudo leer la edición');return r.json();});
 cache.set(path,task);task.catch(()=>{if(cache.get(path)===task)cache.delete(path);});return task as Promise<T>;
}
export async function loadIndex<T>(key:'explorer'|'funding'|'institutions'|'sources',fresh=false){const manifest=await readJson<{paths:Record<string,string>}>('data/manifest.json',fresh);const path=manifest.paths?.[key];if(typeof path!=='string'||!path)throw new Error('Índice no disponible en esta edición');return readJson<T>(path,fresh);}

// A failed card must not hide the conditions of the other cards on the page.
// Keep keys tied to immutable edition paths, so a newer index cannot show old facts.
export async function loadDetails(paths:string[],fresh=false){
 const unique=[...new Set(paths)];
 const outcomes=await Promise.allSettled(unique.map(async path=>{
  const record=await readJson<Opportunity>(path,fresh);
  if(!record||typeof record.id!=='string'||!record.funding||typeof record.entry!=='string')throw new Error('Ficha incompleta');
  return record;
 }));
 const records:Record<string,Opportunity>={},failedPaths:string[]=[];
 outcomes.forEach((result,index)=>{if(result.status==='fulfilled')records[unique[index]]=result.value;else failedPaths.push(unique[index]);});
 return {records,failedPaths};
}
