import {createHash} from 'node:crypto';

export function observationId(observation){
 return createHash('sha256').update(observation.url+'|'+observation.checkedAt).digest('hex');
}

// Read the database on every attempt: a lost response may follow a committed
// transaction, so a local checkpoint cannot establish which rows are missing.
export async function syncObservations(sql,observations,{runId,fallbackRunId,lookupBatchSize=1000,insertBatchSize=100}={}){
 if(!Array.isArray(observations))throw new TypeError('Observations must be an array');
 if(!Number.isInteger(lookupBatchSize)||lookupBatchSize<1||lookupBatchSize>1000)throw new RangeError('Observation lookup batch must contain 1–1000 IDs');
 if(!Number.isInteger(insertBatchSize)||insertBatchSize<1||insertBatchSize>100)throw new RangeError('Observation insert batch must contain 1–100 rows');
 const unique=new Map();
 for(const observation of observations){
  if(typeof observation.url!=='string'||!observation.url||typeof observation.checkedAt!=='string'||!observation.checkedAt)throw new TypeError('Observation requires a URL and checkedAt');
  const id=observationId(observation);
  // Preserve the first occurrence, as the previous ordered INSERT ... DO NOTHING did.
  if(!unique.has(id))unique.set(id,{...observation,id,runId:observation.runId||runId||fallbackRunId});
 }
 const rows=[...unique.values()];
 if(rows.some(row=>!row.runId))throw new TypeError('Observation requires its original or fallback run ID');
 const result={total:observations.length,unique:rows.length,alreadyPresent:0,inserted:0,concurrentConflicts:0};
 for(let offset=0;offset<rows.length;offset+=lookupBatchSize){
  const batch=rows.slice(offset,offset+lookupBatchSize);
  const ids=batch.map(row=>row.id);
  const existing=new Set((await sql`SELECT id FROM observations WHERE id = ANY(${ids}::text[])`).map(row=>row.id));
  const missing=batch.filter(row=>!existing.has(row.id));
  result.alreadyPresent+=batch.length-missing.length;
  for(let start=0;start<missing.length;start+=insertBatchSize){
   const inserts=missing.slice(start,start+insertBatchSize);
   // A concurrent writer may insert after the lookup. Never replace its history.
   const inserted=await sql.transaction(inserts.map(o=>sql`INSERT INTO observations(id,run_id,url,checked_at,http_status,content_hash,outcome) VALUES(${o.id},${o.runId},${o.url},${o.checkedAt},${o.httpStatus},${o.hash},${o.outcome}) ON CONFLICT(id) DO NOTHING RETURNING id`));
   const count=inserted.reduce((sum,returned)=>sum+returned.length,0);
   result.inserted+=count;
   result.concurrentConflicts+=inserts.length-count;
  }
 }
 return result;
}
