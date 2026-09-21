import {idFor} from './domain.mjs';
import {mergeProgrammeRecords} from './programme-record.mjs';

// A checkpoint is a recoverable partial edition, never an assertion that every
// programme has been checked. Failed checks retain the last valid record.
export function programmeCheckpoint({initial,allSeeds,records,reports,run,startedAt,total,started,selected=false,finished=false,now=new Date().toISOString()}){
 if(finished&&reports.length!==total)throw new Error('programme_checkpoint_incomplete');
 const merged=mergeProgrammeRecords(initial.records,records,reports);
 const seedSourceIds=new Set(allSeeds.map(s=>'programme-'+idFor(s.url)));
 const retainedSourceIds=new Set(merged.map(r=>r.sourceId));
 const sources=new Map(initial.sources.filter(s=>!s.id.startsWith('programme-')||seedSourceIds.has(s.id)||retainedSourceIds.has(s.id)).map(s=>[s.id,s]));
 for(const report of reports)sources.set(report.id,report);
 const partial=reports.filter(r=>r.status==='partial').length;
 const summary={startedAt,finishedAt:finished?now:null,checkpointedAt:now,scope:selected?'selected-programmes':'all-programmes',status:finished?(partial?'partial':'complete'):'running',complete:finished,total,attempted:started,completed:reports.length,inFlight:started-reports.length,remaining:total-reports.length,verified:records.length,partial};
 const allSources=[...sources.values()];
 const data={...initial,records:merged,sources:allSources,generatedAt:now,run:{...run,...(run.type==='programme-verification'?{sources:reports}:{}),finishedAt:finished?now:null,status:finished?(allSources.some(s=>s.status==='partial')?'partial':run.status==='running'?'complete':run.status):'running',programmes:summary}};
 if(finished&&!selected)data.programmesCheckedAt=now;
 return data;
}

// The timer and four workers share this writer. A failed write stops the queue,
// so a later checkpoint cannot hide that catalogue/observations were not saved.
export function serialCheckpointWriter(save){
 let tail=Promise.resolve(),failure;
 return {
  write(snapshot){
   const task=tail.then(()=>{if(failure)throw failure;return save(snapshot);});
   tail=task.catch(error=>{failure??=error;});
   return task;
  },
  async flush(){await tail;if(failure)throw failure;},
 };
}
