import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import {readCrawlState,writeCrawlState} from './crawl-state.mjs';
test('compressed checkpoints preserve every job, retry, source and run; the summary stays reviewable',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'trama-crawl-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const file=path.join(dir,'queue.json.gz');
 const state={schemaVersion:1,generatedAt:'2026-09-19',jobs:[{id:'a',url:'https://example.edu/plan?a=1',status:'access-pending',nextCheckAt:'2026-09-26',contentHash:'old-proof',label:'Dátuvísindi'}],runs:[{id:'run',attempted:1}],summary:{jobs:1}};
 await writeCrawlState(state,file);assert.deepEqual(await readCrawlState(file),state);
 const summary=JSON.parse(await fs.readFile(path.join(dir,'queue.summary.json'),'utf8'));
 assert.equal(summary.serializedJobs,1);assert.equal(summary.jobs,undefined);assert.deepEqual(summary.runs,state.runs);
 state.jobs.push({id:'b',status:'pending'});await writeCrawlState(state,file);assert.deepEqual(await readCrawlState(file),state);
 assert.deepEqual(await readCrawlState(path.join(dir,'new.json.gz')),{schemaVersion:1,jobs:[],runs:[]});
});
test('a corrupt checkpoint is never treated as an empty crawl',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'trama-corrupt-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const file=path.join(dir,'queue.json.gz');await fs.writeFile(file,'corrupt');await assert.rejects(readCrawlState(file));
 await assert.rejects(writeCrawlState({schemaVersion:1,jobs:null,runs:[]},file),/invalid_crawl_state/);
 assert.equal(await fs.readFile(file,'utf8'),'corrupt');
});

test('legacy checkpoints migrate into bounded parts without losing or reordering observations',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'trama-migrate-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const file=path.join(dir,'queue.json.gz');
 const state={schemaVersion:1,generatedAt:'2026-09-21',jobs:Array.from({length:15},(_,i)=>({id:String(i),url:'https://example.edu/'+i,label:'Ανάλυση δεδομένων',status:i%2?'read':'access-pending',history:[{status:403,at:'2026-09-20'}]})),runs:[{id:'old-run',errors:['timeout']}],summary:{read:7},futureMetadata:{keep:true}};
 await fs.writeFile(file,gzipSync(JSON.stringify(state)));
 assert.deepEqual(await readCrawlState(file),state);
 const info=await writeCrawlState(state,file,{maxBytes:420});assert.ok(info.parts>1);assert.ok(info.maxPartBytes<=420);
 assert.deepEqual(await readCrawlState(file),state);
 const manifest=JSON.parse(gunzipSync(await fs.readFile(file)));
 assert.equal(manifest.jobs,undefined);assert.equal(manifest.crawlStorage.count,15);
 for(const part of manifest.crawlStorage.parts)assert.ok(gunzipSync(await fs.readFile(path.join(dir,part.file))).length<=420);
 // Shrinking a checkpoint retires only its own obsolete parts.
 await fs.writeFile(path.join(dir,'queue.parts','user-note.txt'),'keep');
 state.jobs=[];await writeCrawlState(state,file,{maxBytes:420});
 assert.deepEqual(await readCrawlState(file),state);assert.deepEqual(await fs.readdir(path.join(dir,'queue.parts')),['user-note.txt']);
});

test('missing or altered parts and a missing manifest fail instead of yielding partial history',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'trama-parts-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const file=path.join(dir,'queue.json.gz'),state={schemaVersion:1,jobs:[{id:'known',retries:3}],runs:[{id:'preserved'}]};
 await writeCrawlState(state,file);const bytes=await fs.readFile(file),manifest=JSON.parse(gunzipSync(bytes));
 const partFile=path.join(dir,manifest.crawlStorage.parts[0].file),part=await fs.readFile(partFile);
 await fs.unlink(partFile);await assert.rejects(readCrawlState(file),{code:'ENOENT'});
 await fs.writeFile(partFile,Buffer.from('altered'));await assert.rejects(readCrawlState(file),/crawl_part_hash_mismatch/);
 await fs.writeFile(partFile,part);await fs.unlink(file);await assert.rejects(readCrawlState(file),/crawl_manifest_missing/);
 await fs.writeFile(file,bytes);assert.deepEqual(await readCrawlState(file),state);
});

test('manifest paths, counts and expansion budgets cannot silently change the crawl',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'trama-manifest-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const file=path.join(dir,'queue.json.gz'),state={schemaVersion:1,jobs:[{id:'one'}],runs:[]};
 await writeCrawlState(state,file);const original=JSON.parse(gunzipSync(await fs.readFile(file)));
 for(const [mutate,expected]of [
  [m=>m.crawlStorage.parts[0].file='../outside.json.gz',/invalid_crawl_part_path/],
  [m=>m.crawlStorage.parts.push(m.crawlStorage.parts[0]),/invalid_crawl_part_path/],
  [m=>m.crawlStorage.parts[0].count=2,/crawl_part_count_mismatch/],
  [m=>m.crawlStorage.count=0,/crawl_count_mismatch/],
  [m=>m.crawlStorage.parts[0].uncompressedBytes=512_000_001,/invalid_crawl_part_size/]
 ]){
  const changed=structuredClone(original);mutate(changed);await fs.writeFile(file,gzipSync(JSON.stringify(changed)));await assert.rejects(readCrawlState(file),expected);
 }
});

test('an oversized single job or invalid part budget leaves the committed checkpoint intact',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'trama-budget-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const file=path.join(dir,'queue.json.gz'),state={schemaVersion:1,jobs:[{id:'kept'}],runs:[]};
 await writeCrawlState(state,file);const original=await fs.readFile(file);
 await assert.rejects(writeCrawlState({...state,jobs:[{id:'x'.repeat(500)}]},file,{maxBytes:100}),/crawl_job_exceeds_part_budget/);
 await assert.rejects(writeCrawlState(state,file,{maxBytes:0}),/invalid_crawl_part_budget/);
 await assert.rejects(writeCrawlState(state,path.join(dir,'wrong.json')),/crawl_state_requires_json_gz_extension/);
 assert.deepEqual(await fs.readFile(file),original);assert.deepEqual(await readCrawlState(file),state);
});
