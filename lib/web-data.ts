import {assetPath} from './site-path';
const cache=new Map<string,Promise<unknown>>();
export async function readJson<T>(path:string,fresh=false):Promise<T>{
 if(!fresh&&cache.has(path))return cache.get(path) as Promise<T>;
 const task=fetch(assetPath(path),{signal:AbortSignal.timeout(20000),...(fresh?{cache:'no-cache' as const}:{})}).then(r=>{if(!r.ok)throw new Error('No se pudo leer la edición');return r.json();});
 cache.set(path,task);task.catch(()=>cache.delete(path));return task as Promise<T>;
}
export async function loadIndex<T>(key:'explorer'|'funding'|'institutions'|'sources',fresh=false){const manifest=await readJson<{paths:Record<string,string>}>('data/manifest.json',fresh);return readJson<T>(manifest.paths[key],fresh);}
