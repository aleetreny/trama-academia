import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {observationId,syncObservations} from '../db/sync-observations.mjs';

const observation=(n,extra={})=>({url:`https://example.edu/programme/${n}?view=full`,checkedAt:'2026-09-21T10:00:00.000Z',httpStatus:200,hash:`hash-${n}`,outcome:'ok',runId:`original-run-${n}`,...extra});

function database(initial=[],options={}){
 const rows=new Map(initial.map(row=>[observationId(row),{...row,id:observationId(row)}]));
 const lookups=[],transactions=[];
 const sql=(strings,...values)=>{
  const query=strings.join('?');
  if(query.startsWith('SELECT')){
   assert.equal(query,'SELECT id FROM observations WHERE id = ANY(?::text[])');
   const ids=values[0];lookups.push([...ids]);
   if(options.failLookup===lookups.length)return Promise.reject(new Error('lookup unavailable'));
   return Promise.resolve(ids.filter(id=>rows.has(id)).map(id=>({id})));
  }
  assert.match(query,/^INSERT INTO observations\(id,run_id,url,checked_at,http_status,content_hash,outcome\)/);
  assert.match(query,/ON CONFLICT\(id\) DO NOTHING RETURNING id$/);
  const [id,runId,url,checkedAt,httpStatus,hash,outcome]=values;
  return {id,runId,url,checkedAt,httpStatus,hash,outcome};
 };
 sql.transaction=async inserts=>{
  transactions.push(inserts);
  if(options.failBefore===transactions.length)throw new Error('transaction failed');
  if(options.beforeInsert)options.beforeInsert(rows,inserts);
  const result=inserts.map(row=>{
   if(rows.has(row.id))return [];
   rows.set(row.id,{...row});return [{id:row.id}];
  });
  if(options.failAfter===transactions.length)throw new Error('commit response lost');
  return result;
 };
 return {sql,rows,lookups,transactions};
}

test('observation sync only inserts missing IDs in bounded batches and preserves provenance',async()=>{
 const source=Array.from({length:11},(_,i)=>observation(i));
 source[2].runId=undefined;source[5].runId=undefined;
 const previous={...source[0],runId:'historical-run',hash:'historical-hash'};
 const db=database([previous,source[4]]);
 const duplicate={...source[3],runId:'later-run',hash:'later-hash'};
 const input=[...source,duplicate];const before=structuredClone(input);
 const result=await syncObservations(db.sql,input,{runId:'envelope-run',fallbackRunId:'current-run',lookupBatchSize:4,insertBatchSize:2});
 assert.deepEqual(result,{total:12,unique:11,alreadyPresent:2,inserted:9,concurrentConflicts:0});
 assert.deepEqual(db.lookups.map(ids=>ids.length),[4,4,3]);
 assert.ok(db.transactions.every(rows=>rows.length<=2));
 assert.equal(db.transactions.flat().length,9);
 assert.equal(db.rows.get(observationId(source[0])).runId,'historical-run');
 assert.equal(db.rows.get(observationId(source[0])).hash,'historical-hash');
 assert.equal(db.rows.get(observationId(source[2])).runId,'envelope-run');
 assert.equal(db.rows.get(observationId(source[3])).runId,'original-run-3');
 for(const row of db.transactions.flat()){
  assert.equal(row.id,createHash('sha256').update(row.url+'|'+row.checkedAt).digest('hex'));
  assert.equal(row.checkedAt,'2026-09-21T10:00:00.000Z');
 }
 assert.deepEqual(input,before);
});

for(const failure of ['failBefore','failAfter'])test(`observation sync resumes from database after ${failure} without replaying committed inserts`,async()=>{
 const source=Array.from({length:7},(_,i)=>observation(i));
 const options={[failure]:2};const db=database([],options);
 await assert.rejects(syncObservations(db.sql,source,{lookupBatchSize:4,insertBatchSize:2}),/transaction failed|commit response lost/);
 const committed=new Set(db.rows.keys());assert.equal(committed.size,failure==='failBefore'?2:4);
 options[failure]=null;db.transactions.length=0;db.lookups.length=0;
 const result=await syncObservations(db.sql,source,{fallbackRunId:'a-new-run',lookupBatchSize:4,insertBatchSize:2});
 assert.equal(result.alreadyPresent,committed.size);
 assert.equal(result.inserted,source.length-committed.size);
 assert.ok(db.transactions.flat().every(row=>!committed.has(row.id)));
 assert.equal(db.lookups.length,2);
 assert.equal(db.rows.size,7);
 for(const row of source)assert.equal(db.rows.get(observationId(row)).runId,row.runId);
});

test('observation sync never overwrites a row inserted between lookup and transaction',async()=>{
 const source=observation(1);const concurrent={...source,id:observationId(source),runId:'other-writer',hash:'other-hash'};
 const db=database([],{beforeInsert(rows){rows.set(concurrent.id,concurrent);}});
 const result=await syncObservations(db.sql,[source]);
 assert.equal(result.inserted,0);assert.equal(result.concurrentConflicts,1);
 assert.deepEqual(db.rows.get(concurrent.id),concurrent);
});

test('observation sync rechecks an entirely synchronized archive without issuing transactions',async()=>{
 const source=Array.from({length:1001},(_,i)=>observation(i));const db=database(source);
 const result=await syncObservations(db.sql,source);
 assert.equal(result.alreadyPresent,1001);assert.equal(result.inserted,0);
 assert.deepEqual(db.lookups.map(ids=>ids.length),[1000,1]);
 assert.equal(db.transactions.length,0);
});

test('observation sync uses the current run only for legacy rows without original or envelope provenance',async()=>{
 const source=observation(1,{runId:undefined});const db=database();
 await syncObservations(db.sql,[source],{fallbackRunId:'legacy-fallback'});
 assert.equal(db.rows.get(observationId(source)).runId,'legacy-fallback');
 const empty=database();
 assert.equal((await syncObservations(empty.sql,[])).inserted,0);
 assert.equal(empty.lookups.length,0);
});

test('observation sync stops on lookup failure and validates bounds before writing',async()=>{
 const db=database([],{failLookup:1});
 await assert.rejects(syncObservations(db.sql,[observation(1)]),/lookup unavailable/);
 assert.equal(db.transactions.length,0);
 for(const options of [{lookupBatchSize:0},{lookupBatchSize:1001},{insertBatchSize:101},{insertBatchSize:1.5}]){
  await assert.rejects(syncObservations(db.sql,[observation(1)],options),RangeError);
 }
 await assert.rejects(syncObservations(db.sql,[observation(1,{runId:undefined})]),/run ID/);
 assert.equal(db.lookups.length,1);
});
