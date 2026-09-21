import test from 'node:test';
import assert from 'node:assert/strict';
import {programmeCheckpoint,serialCheckpointWriter} from './programme-checkpoint.mjs';
import {idFor} from './domain.mjs';

const seeds=['one','two','three'].map(name=>({url:'https://example.edu/'+name}));
const oldRecords=seeds.map((s,i)=>({id:idFor(s.url),sourceId:'programme-'+idFor(s.url),title:'Programme '+i,status:'programme',verifiedAt:'2026-09-01',funding:{text:'Reviewed funding '+i}}));
const initial={records:oldRecords,sources:oldRecords.map(r=>({id:r.sourceId,status:'healthy',report:{checkedAt:'2026-09-01'}})),programmesCheckedAt:'2026-09-01'};
const run={id:'same-run',type:'programme-verification',startedAt:'2026-09-21T08:00:00Z',status:'running'};
const good={...oldRecords[0],verifiedAt:'2026-09-21'};
const reports=[{id:oldRecords[0].sourceId,status:'healthy',report:{checkedAt:'2026-09-21',errors:[]}},{id:oldRecords[1].sourceId,status:'partial',report:{checkedAt:'2026-09-21',errors:[{error:'http_503'}]}}];
function snapshot(overrides={}){return programmeCheckpoint({initial,allSeeds:seeds,records:[good],reports,run,startedAt:run.startedAt,total:3,started:3,now:'2026-09-21T09:00:00Z',...overrides});}

test('an interrupted checkpoint preserves valid history and does not refresh unchecked programmes',()=>{
 const before=structuredClone(initial),data=snapshot();
 assert.equal(data.run.id,run.id);
 assert.equal(data.run.finishedAt,null);
 assert.equal(data.run.status,'running');
 assert.equal(data.run.programmes.complete,false);
 assert.equal(data.run.programmes.completed,2);
 assert.equal(data.run.programmes.inFlight,1);
 assert.equal(data.run.programmes.remaining,1);
 assert.equal(data.programmesCheckedAt,initial.programmesCheckedAt);
 assert.equal(data.records[0].verifiedAt,'2026-09-21');
 assert.equal(data.records[1].verifiedAt,'2026-09-01');
 assert.equal(data.records[1].funding.text,'Reviewed funding 1');
 assert.equal(data.records[1].status,'unverified');
 assert.equal(data.records[1].lastError,'http_503');
 assert.deepEqual(data.records[2],initial.records[2]);
 assert.deepEqual(data.sources[2],initial.sources[2]);
 assert.deepEqual(initial,before);
});

test('only a finished full pass advances the global date, using the same run and explicit partial status',()=>{
 const data=snapshot({finished:true,reports:[...reports,{id:oldRecords[2].sourceId,status:'healthy',report:{errors:[]}}],records:[good,oldRecords[2]]});
 assert.equal(data.run.id,run.id);
 assert.equal(data.run.status,'partial');
 assert.equal(data.run.programmes.status,'partial');
 assert.equal(data.run.programmes.complete,true);
 assert.equal(data.run.programmes.remaining,0);
 assert.equal(data.programmesCheckedAt,'2026-09-21T09:00:00Z');
 assert.equal(data.run.finishedAt,data.programmesCheckedAt);
 assert.equal(data.run.sources.length,3);
 assert.throws(()=>snapshot({finished:true}),/programme_checkpoint_incomplete/);
});

test('a completed selection preserves the old full-pass date and the surrounding vacancy run',()=>{
 const parentRun={id:'vacancy-run',startedAt:'2026-09-21T07:00:00Z',status:'partial',sources:[{id:'vacancy-source'}]};
 const data=snapshot({finished:true,selected:true,total:2,started:2,run:parentRun});
 assert.equal(data.run.id,parentRun.id);
 assert.deepEqual(data.run.sources,parentRun.sources);
 assert.equal(data.run.programmes.scope,'selected-programmes');
 assert.equal(data.programmesCheckedAt,initial.programmesCheckedAt);
});

test('timer and worker saves serialize catalogue and observations, with completion saved last',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});
 let active=0,maxActive=0;const events=[];
 const writer=serialCheckpointWriter(async data=>{
  active++;maxActive=Math.max(maxActive,active);events.push('catalogue:'+data.sequence);
  if(data.sequence===1)await gate;
  events.push('observations:'+data.sequence+':'+data.runId);active--;
 });
 const writes=[writer.write({sequence:1,runId:'same-run'}),writer.write({sequence:2,runId:'same-run'}),writer.write({sequence:3,runId:'same-run',complete:true})];
 await new Promise(setImmediate);
 assert.deepEqual(events,['catalogue:1']);
 release();await Promise.all(writes);await writer.flush();
 assert.equal(maxActive,1);
 assert.deepEqual(events,['catalogue:1','observations:1:same-run','catalogue:2','observations:2:same-run','catalogue:3','observations:3:same-run']);
});

test('failed observation persistence cannot be hidden by a later successful checkpoint',async()=>{
 const saved=[];const writer=serialCheckpointWriter(async data=>{saved.push(data);throw new Error('observation_write_failed');});
 const first=writer.write('partial'),last=writer.write('finished');
 await assert.rejects(first,/observation_write_failed/);
 await assert.rejects(last,/observation_write_failed/);
 await assert.rejects(writer.flush(),/observation_write_failed/);
 assert.deepEqual(saved,['partial']);
});
