import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {persistObservations} from './http.mjs';
import {idFor} from './domain.mjs';
import {verifyProgramme} from './programme-record.mjs';
import {selectProgrammeSeeds} from './programme-selection.mjs';
import {programmeCheckpoint,serialCheckpointWriter} from './programme-checkpoint.mjs';

const startedAt=new Date().toISOString();
const allSeeds=JSON.parse(await fs.readFile('data/programmes.seed.json','utf8'));
const selectedFile=process.argv.find(arg=>arg.startsWith('--only='))?.slice(7);
const seeds=selectProgrammeSeeds(allSeeds,selectedFile?JSON.parse(await fs.readFile(selectedFile,'utf8')):undefined);
const initial=JSON.parse(await fs.readFile('data/catalogue.json','utf8'));
const run=process.argv.includes('--standalone')||!initial.run?{id:randomUUID(),type:'programme-verification',parentRunId:initial.run?.id||null,startedAt,finishedAt:null,status:'running'}:{...initial.run};
const records=[],reports=[];
let next=0,checkpointError;
const writer=serialCheckpointWriter(async data=>{
 await fs.writeFile('data/catalogue.json.tmp',JSON.stringify(data,null,2)+'\n');
 await fs.rename('data/catalogue.json.tmp','data/catalogue.json');
 await persistObservations({runId:run.id});
 console.log(JSON.stringify({checkpoint:true,runId:run.id,...data.run.programmes}));
});
function checkpoint(finished=false){
 return writer.write(programmeCheckpoint({initial,allSeeds,records:[...records],reports:[...reports],run,startedAt,total:seeds.length,started:next,selected:!!selectedFile,finished})).catch(error=>{checkpointError??=error;throw error;});
}
async function worker(){while(next<seeds.length){
 if(checkpointError)throw checkpointError;
 const seed=seeds[next++];
 const source={id:'programme-'+idFor(seed.url),name:seed.institution+' · '+seed.title,url:seed.url,adapter:'programme',type:seed.kind.includes('funding')?'funder':'institution',scope:seed.country,stages:seed.eligibleStages||[seed.stage],enabled:true};
 try{
  const record=await verifyProgramme(seed);records.push(record);
  reports.push({...source,status:'healthy',report:{checkedAt:record.verifiedAt,pages:record.evidence.references.length,accepted:1,complete:true,errors:[]}});
  console.log(JSON.stringify({programme:seed.title,status:'verified'}));
 }catch(error){
  reports.push({...source,status:'partial',report:{checkedAt:new Date().toISOString(),accepted:0,complete:false,errors:[{error:error.message}]}});
  console.log(JSON.stringify({programme:seed.title,status:error.message}));
 }
 if(reports.length%25===0)await checkpoint();
}}
await checkpoint();
const timer=setInterval(()=>{checkpoint().catch(error=>{checkpointError??=error;});},30000);
let outcomes;
try{outcomes=await Promise.allSettled([worker(),worker(),worker(),worker()]);}
finally{clearInterval(timer);}
await writer.flush();
const failed=outcomes.find(outcome=>outcome.status==='rejected');
if(failed)throw failed.reason;
if(checkpointError)throw checkpointError;
await checkpoint(true);
