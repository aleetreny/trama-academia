import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gzip,gunzip} from 'node:zlib';
import {promisify} from 'node:util';

export const CRAWL_FILE='data/institution-crawl.json.gz';
const compress=promisify(gzip),expand=promisify(gunzip);
const format='institution-crawl-gzip-parts-v1';
const maxExpandedBytes=512_000_000;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const atomicWrite=async(file,bytes)=>{await fs.writeFile(file+'.tmp',bytes);await fs.rename(file+'.tmp',file);};
function validate(state){
 if(state?.schemaVersion!==1||!Array.isArray(state.jobs)||!Array.isArray(state.runs)||'crawlStorage' in state)throw new Error('invalid_crawl_state');
 return state;
}
export async function readCrawlState(file=CRAWL_FILE){
 for(let attempt=0;attempt<4;attempt++){
  let bytes;try{bytes=await fs.readFile(file);}catch(error){
   if(error.code==='ENOENT'&&attempt===0){
    const parts=await fs.readdir(path.join(path.dirname(file),path.basename(file,'.json.gz')+'.parts')).catch(e=>{if(e.code==='ENOENT')return [];throw e;});
    if(parts.some(name=>/^\d{3,}-[a-f0-9]{64}\.json\.gz$/.test(name)))throw new Error('crawl_manifest_missing');
    return {schemaVersion:1,jobs:[],runs:[]};
   }
   throw error;
  }
  // Old monolithic checkpoints remain readable; corrupt data must never reset history.
  const manifest=JSON.parse((await expand(bytes,{maxOutputLength:maxExpandedBytes})).toString('utf8'));
  if(Array.isArray(manifest.jobs))return validate(manifest);
  const {crawlStorage:storage,...metadata}=manifest;
  if(storage?.format!==format||!Array.isArray(storage.parts)||!Number.isSafeInteger(storage.count)||storage.count<0)throw new Error('invalid_crawl_storage');
  const prefix=path.basename(file,'.json.gz')+'.parts/';
  const jobs=[];let expandedBytes=0;const seen=new Set();
  try{
   for(const part of storage.parts){
    if(typeof part.file!=='string'||!part.file.startsWith(prefix)||!/^\d{3,}-[a-f0-9]{64}\.json\.gz$/.test(part.file.slice(prefix.length))||seen.has(part.file))throw new Error('invalid_crawl_part_path');
    seen.add(part.file);
    if(!Number.isSafeInteger(part.count)||part.count<1||!Number.isSafeInteger(part.uncompressedBytes)||part.uncompressedBytes<1||expandedBytes+part.uncompressedBytes>maxExpandedBytes)throw new Error('invalid_crawl_part_size');
    const compressed=await fs.readFile(path.join(path.dirname(file),part.file));
    if(digest(compressed)!==part.sha256)throw new Error('crawl_part_hash_mismatch');
    const body=await expand(compressed,{maxOutputLength:part.uncompressedBytes});
    if(body.length!==part.uncompressedBytes)throw new Error('crawl_part_size_mismatch');
    expandedBytes+=body.length;
    const rows=JSON.parse(body).jobs;
    if(!Array.isArray(rows)||rows.length!==part.count)throw new Error('crawl_part_count_mismatch');
    for(const row of rows)jobs.push(row);
   }
   if(jobs.length!==storage.count)throw new Error('crawl_count_mismatch');
   return validate({...metadata,jobs});
  }catch(error){
   // A concurrent reader may have opened the previous manifest just before the
   // writer replaced it and retired its parts. Retry only after a real replacement.
   if(attempt===3||error.code!=='ENOENT'||(await fs.readFile(file)).equals(bytes))throw error;
  }
 }
}
export async function writeCrawlState(state,file=CRAWL_FILE,{maxBytes=8*1024*1024}={}){
 validate(state);
 const summaryFile=file.replace(/\.json\.gz$/,'.summary.json');
 if(summaryFile===file)throw new Error('crawl_state_requires_json_gz_extension');
 if(!Number.isSafeInteger(maxBytes)||maxBytes<16||maxBytes>maxExpandedBytes)throw new Error('invalid_crawl_part_budget');
 const chunks=[];let rows=[],size=12,total=0;
 for(const job of state.jobs){
  const serialized=JSON.stringify(job),bytes=Buffer.byteLength(serialized);
  if(bytes+12>maxBytes)throw new Error('crawl_job_exceeds_part_budget');
  if(rows.length&&size+bytes+1>maxBytes){chunks.push(rows);total+=size;rows=[];size=12;}
  rows.push(serialized);size+=bytes+(rows.length>1?1:0);
 }
 if(rows.length){chunks.push(rows);total+=size;}
 if(total>maxExpandedBytes)throw new Error('crawl_state_exceeds_budget');
 const partsDirectory=path.basename(file,'.json.gz')+'.parts',directory=path.dirname(file);
 await fs.mkdir(path.join(directory,partsDirectory),{recursive:true});
 const parts=[];
 for(const [index,chunk]of chunks.entries()){
  const body=Buffer.from('{"jobs":['+chunk.join(',')+']}\n'),bytes=await compress(body,{level:6}),sha256=digest(bytes);
  const part={file:partsDirectory+'/'+String(index).padStart(3,'0')+'-'+sha256+'.json.gz',count:chunk.length,sha256,uncompressedBytes:body.length};
  await atomicWrite(path.join(directory,part.file),bytes);parts.push(part);
 }
 const {jobs,...summary}=state;
 const manifest={...summary,crawlStorage:{format,count:jobs.length,parts}};
 await atomicWrite(file,await compress(Buffer.from(JSON.stringify(manifest)+'\n'),{level:6}));
 // A small, reviewable companion; the compressed queue remains authoritative.
 await atomicWrite(summaryFile,JSON.stringify({...summary,serializedJobs:jobs.length},null,2)+'\n');
 const current=new Set(parts.map(part=>path.basename(part.file)));
 for(const name of await fs.readdir(path.join(directory,partsDirectory)))if(/^\d{3,}-[a-f0-9]{64}\.json\.gz$/.test(name)&&!current.has(name))await fs.unlink(path.join(directory,partsDirectory,name));
 return {jobs:jobs.length,parts:parts.length,maxPartBytes:Math.max(0,...parts.map(part=>part.uncompressedBytes))};
}
