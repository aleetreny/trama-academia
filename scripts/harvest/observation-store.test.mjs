import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {persistObservationFile} from './observation-store.mjs';

const old={url:'https://example.edu/old',checkedAt:'2026-09-01',hash:'old',outcome:'ok'};
const fresh={url:'https://example.edu/new',checkedAt:'2026-09-21',hash:'new',outcome:'ok'};
async function fixture(t){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'trama-observation-store-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));return path.join(dir,'cache','observations.json');}

test('observation checkpoints keep historical run identities and deduplicate repeated saves',async t=>{
 const file=await fixture(t);
 await persistObservationFile(file,[old],{runId:'old-run'});
 await persistObservationFile(file,[fresh],{runId:'new-run'});
 await persistObservationFile(file,[fresh],{runId:'new-run'});
 const value=JSON.parse(await fs.readFile(file,'utf8'));
 assert.equal(value.runId,'new-run');
 assert.deepEqual(value.observations,[{...old,runId:'old-run'},{...fresh,runId:'new-run'}]);
});

test('a duplicate observation cannot reassign the historical run or payload',async t=>{
 const file=await fixture(t);
 await persistObservationFile(file,[old],{runId:'original-run'});
 await persistObservationFile(file,[{...old,runId:'different-run',hash:'different-hash',outcome:'different-outcome'}],{runId:'retry-run'});
 assert.deepEqual(JSON.parse(await fs.readFile(file,'utf8')).observations,[{...old,runId:'original-run'}]);
});

test('an interrupted temporary write cannot truncate the previous observation history',async t=>{
 const file=await fixture(t);
 await persistObservationFile(file,[old],{runId:'old-run'});
 const io={...fs,writeFile:async target=>{await fs.writeFile(target,'{');throw new Error('interrupted_write');}};
 await assert.rejects(persistObservationFile(file,[fresh],{runId:'new-run',io}),/interrupted_write/);
 assert.deepEqual(JSON.parse(await fs.readFile(file,'utf8')).observations,[{...old,runId:'old-run'}]);
 await persistObservationFile(file,[fresh],{runId:'new-run'});
 assert.deepEqual(JSON.parse(await fs.readFile(file,'utf8')).observations,[{...old,runId:'old-run'},{...fresh,runId:'new-run'}]);
});

test('a corrupt pre-existing cache fails explicitly instead of silently discarding its history',async t=>{
 const file=await fixture(t);await fs.mkdir(path.dirname(file));await fs.writeFile(file,'{');
 await assert.rejects(persistObservationFile(file,[fresh],{runId:'new-run'}),SyntaxError);
 assert.equal(await fs.readFile(file,'utf8'),'{');
 await fs.writeFile(file,JSON.stringify({observations:'invalid'}));
 await assert.rejects(persistObservationFile(file,[fresh]),/invalid_observation_cache/);
});

test('missing observation identities fail without collapsing rows or replacing valid history',async t=>{
 const file=await fixture(t);
 await persistObservationFile(file,[old],{runId:'original-run'});
 for(const invalid of [{a:1},{...fresh,url:''},{...fresh,checkedAt:' '}]){
  await assert.rejects(persistObservationFile(file,[invalid]),/invalid_observation_identity/);
  assert.deepEqual(JSON.parse(await fs.readFile(file,'utf8')).observations,[{...old,runId:'original-run'}]);
 }
 const invalidHistory=JSON.stringify({observations:[{a:1},{a:2}]});
 await fs.writeFile(file,invalidHistory);
 await assert.rejects(persistObservationFile(file,[fresh]),/invalid_observation_identity/);
 assert.equal(await fs.readFile(file,'utf8'),invalidHistory);
});

test('read failures other than missing files cannot replace an existing cache',async()=>{
 let writes=0;const denied=Object.assign(new Error('permission_denied'),{code:'EACCES'});
 const io={readFile:async()=>{throw denied;},writeFile:async()=>{writes++;}};
 await assert.rejects(persistObservationFile('/unused/observations.json',[fresh],{io}),/permission_denied/);
 assert.equal(writes,0);
});
