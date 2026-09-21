import fs from 'node:fs/promises';
import path from 'node:path';
import robotsParser from 'robots-parser';
import {hash} from './domain.mjs';
import {persistObservationFile} from './observation-store.mjs';
export const AGENT='TramaResearchBot/1.0 (+https://github.com/aleetreny/trama-academia)';
const queues=new Map(),robots=new Map(),lastRequest=new Map();
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const cacheDir=path.resolve('.cache/http');
export const observations=[];
export async function readResponseBytes(response,limit=10_000_000){
 const reader=response.body?.getReader();if(!reader)return Buffer.alloc(0);
 const chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error('response_too_large');}chunks.push(Buffer.from(value));}}
 finally{reader.releaseLock();}
 return Buffer.concat(chunks,size);
}
async function serial(host,fn){const before=queues.get(host)||Promise.resolve();const current=before.catch(()=>{}).then(fn);queues.set(host,current.catch(()=>{}));return current;}
async function policy(origin){
 if(!robots.has(origin))robots.set(origin,(async()=>{
  const url=origin+'/robots.txt';const r=await fetch(url,{headers:{'User-Agent':AGENT},signal:AbortSignal.timeout(20000)});
  if([404,410].includes(r.status))return robotsParser(url,'User-agent: *\nAllow: /');
  if(!r.ok)throw new Error('robots_unavailable_'+r.status);
  const body=(await readResponseBytes(r,1_000_000)).toString('utf8');if(/<html/i.test(body))throw new Error('robots_invalid');
  return robotsParser(url,body);
 })());return robots.get(origin);
}
async function allowedFetch(url,headers){
 let current=url;
 for(let hop=0;hop<6;hop++){
  const u=new URL(current);if(u.protocol!=='https:')throw new Error('https_required');
  const rules=await policy(u.origin);if(rules.isAllowed(current,AGENT)===false)throw new Error('robots_disallowed');
  await delay(Math.max(0,Math.max(800,(rules.getCrawlDelay(AGENT)||0)*1000)-(Date.now()-(lastRequest.get(u.origin)||0))));
  lastRequest.set(u.origin,Date.now());
  const r=await fetch(current,{headers,signal:AbortSignal.timeout(30000),redirect:'manual'});
  if([301,302,303,307,308].includes(r.status)){
   const location=r.headers.get('location');if(!location)throw new Error('redirect_without_location');
   current=new URL(location,current).href;await r.body?.cancel();continue;
  }
  return {response:r,finalUrl:current};
 }
 throw new Error('redirect_limit');
}
export async function getPage(url,{refresh=false,format='text'}={}){
 const u=new URL(url);if(u.protocol!=='https:')throw new Error('https_required');
 return serial(u.origin,async()=>{
  const checkedAt=new Date().toISOString();let httpStatus=null;
  try{
   await fs.mkdir(cacheDir,{recursive:true});const file=path.join(cacheDir,hash(url)+'.json');let cached;
   try{cached=JSON.parse(await fs.readFile(file,'utf8'));}catch{}
   // A cached body is not a new network check: retain its original timestamp.
   if(cached&&(cached.format||'text')!==format)cached=null;
   if(!refresh&&cached&&Date.now()-Date.parse(cached.checkedAt)<6*3600000)return {...cached,cached:true};
   const headers={'User-Agent':AGENT,Accept:format==='pdf'?'application/pdf':'text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.5'};
   if(cached?.etag)headers['If-None-Match']=cached.etag;
   if(cached?.lastModified)headers['If-Modified-Since']=cached.lastModified;
   let response,finalUrl;
   for(let attempt=0;attempt<3;attempt++){
    try{({response,finalUrl}=await allowedFetch(url,headers));}
    catch(e){if(attempt===2||!/fetch failed|timeout|aborted/i.test(e.message))throw e;await delay(2000*2**attempt);continue;}
    httpStatus=response.status;if(![429,500,502,503,504].includes(httpStatus)||attempt===2)break;
    const retryAfter=response.headers.get('retry-after');const seconds=Number(retryAfter)||Math.max(0,(Date.parse(retryAfter)-Date.now())/1000)||2**(attempt+2);
    await response.body?.cancel();if(seconds>120)throw new Error('retry_after_deferred');await delay(seconds*1000);
   }
   if(httpStatus===304&&cached){const value={...cached,checkedAt,status:304};await fs.writeFile(file,JSON.stringify(value));observations.push({url,checkedAt,httpStatus,hash:value.hash,outcome:'not_modified'});return value;}
   if(!response?.ok)throw new Error('http_'+httpStatus);
   const bytes=await readResponseBytes(response);
   if(format==='pdf'&&bytes.subarray(0,5).toString()!=='%PDF-')throw new Error('invalid_pdf_response');
   const body=format==='pdf'?bytes.toString('base64'):bytes.toString('utf8');
   const isJson=/application\/(?:[\w.+-]*\+)?json/i.test(response.headers.get('content-type')||'');
   if(format!=='pdf'&&((body.length<100&&!isJson)||/Just a moment\.\.\.|cf-chl-|verify you are human|Access Denied/i.test(body.slice(0,12000))))throw new Error('challenge_or_empty');
   if(isJson&&format!=='pdf'){try{JSON.parse(body);}catch{throw new Error('invalid_json');}}
   const result={url,finalUrl,body,format,checkedAt,status:httpStatus,hash:hash(bytes),etag:response.headers.get('etag'),lastModified:response.headers.get('last-modified')};
   await fs.writeFile(file,JSON.stringify(result));observations.push({url,checkedAt,httpStatus,hash:result.hash,outcome:'ok'});return result;
  }catch(error){observations.push({url,checkedAt,httpStatus,hash:null,outcome:error.message});throw error;}
 });
}
export async function persistObservations({runId}={}){
 await persistObservationFile('.cache/observations.json',observations,{runId});
}
