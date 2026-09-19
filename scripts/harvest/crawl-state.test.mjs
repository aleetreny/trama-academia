import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
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
