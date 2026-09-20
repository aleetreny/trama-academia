const MAX_AGE=7*86400000;
const SELECT='id,ror,display_name,country_code,type,geo';
const validRor=s=>/^https:\/\/ror\.org\/[a-z0-9]{9}$/.test(s);

// Reuse completed identity batches by ROR, even when the universe grows and
// changes batch boundaries. References also preserve genuine negative matches.
export function reusableIdentities(snapshot,rors,now=Date.now()){
 const wanted=new Set(rors),covered=new Set(),references=[],directory={};
 for(const reference of snapshot?.references||[]){
  const age=now-Date.parse(reference.checkedAt);if(!Number.isFinite(age)||age<0||age>=MAX_AGE)continue;
  let url;try{url=new URL(reference.url);}catch{continue;}
  if(url.origin!=='https://api.openalex.org'||url.pathname!=='/institutions'||url.searchParams.get('per_page')!=='100'||url.searchParams.get('select')!==SELECT)continue;
  const filter=url.searchParams.get('filter');if(!filter?.startsWith('ror:'))continue;
  const batch=filter.slice(4).split('|');if(batch.length>100||!batch.every(validRor))continue;
  if(!batch.some(ror=>wanted.has(ror)))continue;
  references.push(reference);for(const ror of batch)if(wanted.has(ror))covered.add(ror);
 }
 for(const ror of covered){
  const row=snapshot?.directory?.[ror];if(!row)continue;
  if(row.ror!==ror||!/^https:\/\/openalex\.org\/I\d+$/.test(row.id))throw new Error('invalid_cached_openalex_identity');
  directory[ror]=row;
 }
 return {directory,references,pending:[...wanted].filter(ror=>!covered.has(ror)),covered:covered.size};
}

export async function collectIdentities(rors,{snapshot,fetchPage,onBatch,now=Date.now()}){
 if(!rors.every(validRor))throw new Error('invalid_identity_ror');
 const {directory,references,pending,covered}=reusableIdentities(snapshot,rors,now);
 for(let start=0;start<pending.length;start+=100){
  const batch=pending.slice(start,start+100);
  const response=await fetchPage('/institutions',{filter:'ror:'+batch.join('|'),per_page:100,select:SELECT});
  if(!Array.isArray(response.body.results)||response.body.meta.count!==response.body.results.length||response.body.meta.count>100)throw new Error('incomplete_ror_batch');
  for(const row of response.body.results){
   if(!batch.includes(row.ror)||!/^https:\/\/openalex\.org\/I\d+$/.test(row.id))throw new Error('unexpected_openalex_identity');
   if(directory[row.ror]&&directory[row.ror].id!==row.id)throw new Error('ambiguous_ror');
   directory[row.ror]=row;
  }
  references.push({url:response.url,checkedAt:response.checkedAt});
  await onBatch?.({processed:covered+Math.min(start+100,pending.length),reused:covered,matched:Object.keys(directory).length,remaining:response.remaining});
 }
 return {directory,references};
}
