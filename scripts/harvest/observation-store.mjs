import fs from 'node:fs/promises';
import path from 'node:path';

export async function persistObservationFile(file,observations,{runId,io=fs}={}){
 let previous={};
 try{previous=JSON.parse(await io.readFile(file,'utf8'));}
 catch(error){if(error.code!=='ENOENT')throw error;}
 if(!previous||typeof previous!=='object'||Array.isArray(previous)||previous.observations!==undefined&&!Array.isArray(previous.observations))throw new Error('invalid_observation_cache');
 if(!Array.isArray(observations))throw new Error('invalid_observation_batch');
 for(const observation of [...(previous.observations||[]),...observations]){
  if(!observation||typeof observation.url!=='string'||!observation.url.trim()||typeof observation.checkedAt!=='string'||!observation.checkedAt.trim())throw new Error('invalid_observation_identity');
 }
 const currentRunId=runId||previous.runId;
 const all=[...(previous.observations||[]).map(o=>({...o,runId:o.runId||previous.runId})),...observations.map(o=>({...o,runId:currentRunId}))];
 const unique=new Map();
 // The same observed response keeps its original provenance on later saves.
 for(const observation of all){
  const key=observation.url+'|'+observation.checkedAt;
  if(!unique.has(key))unique.set(key,observation);
 }
 await io.mkdir(path.dirname(file),{recursive:true});
 await io.writeFile(file+'.tmp',JSON.stringify({runId:currentRunId,observations:[...unique.values()]},null,2));
 await io.rename(file+'.tmp',file);
}
