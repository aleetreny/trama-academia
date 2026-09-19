import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const AGENT='TramaResearchBot/1.0 (+https://github.com/aleetreny/trama-academia)';
const cacheDir='.cache/openalex';
let calls=0;
export async function openAlex(path,params={}){
 const url=new URL(path,'https://api.openalex.org');
 for(const [key,value] of Object.entries(params))url.searchParams.set(key,String(value));
 const file=cacheDir+'/'+createHash('sha256').update(url.href).digest('hex')+'.json';
 try{const old=JSON.parse(await fs.readFile(file,'utf8'));if(Date.now()-Date.parse(old.checkedAt)<7*86400000)return old;}catch{}
 try{const quota=JSON.parse(await fs.readFile(cacheDir+'/quota.json','utf8'));if(quota.day===new Date().toISOString().slice(0,10)&&quota.remaining<20)throw new Error('openalex_daily_budget_low');}catch(error){if(error.message==='openalex_daily_budget_low')throw error;}
 if(calls>=600)throw new Error('openalex_run_request_budget_exhausted');
 await fs.mkdir(cacheDir,{recursive:true});
 calls++;
 const response=await fetch(url,{headers:{'User-Agent':AGENT,Accept:'application/json'},signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw new Error('openalex_http_'+response.status+': '+(await response.text()).slice(0,200));
 const remaining=response.headers.get('x-ratelimit-remaining');
 const result={url:url.href,checkedAt:new Date().toISOString(),remaining:remaining===null?null:Number(remaining),body:await response.json()};
 if(result.body.error)throw new Error(result.body.error);
 await fs.writeFile(file,JSON.stringify(result));
 if(result.remaining!==null)await fs.writeFile(cacheDir+'/quota.json',JSON.stringify({day:result.checkedAt.slice(0,10),remaining:result.remaining,checkedAt:result.checkedAt}));
 // Stay inside the anonymous free allowance; no account or paid credentials are used.
 if(result.remaining!==null&&result.remaining<20)throw new Error('openalex_daily_budget_low');
 return result;
}
export async function allGroups(filter,{onPage}={}){
 let cursor='*';const groups=new Map(),references=[];const cursors=new Set();
 while(cursor){
  if(cursors.has(cursor))throw new Error('openalex_repeated_cursor');cursors.add(cursor);
  const result=await openAlex('/works',{filter,group_by:'authorships.institutions.id',per_page:200,cursor});
  if(!Array.isArray(result.body.group_by))throw new Error('openalex_groups_missing');
  for(const group of result.body.group_by){if(groups.has(group.key))throw new Error('openalex_duplicate_group');groups.set(group.key,group);}
  references.push({url:result.url,checkedAt:result.checkedAt,count:result.body.group_by.length});
  cursor=result.body.meta.next_cursor;
  if(onPage)await onPage({pages:references.length,groups:groups.size,remaining:result.remaining});
 }
 return {complete:true,groups:[...groups.values()],references};
}
