import test from 'node:test';
import assert from 'node:assert/strict';
import {readJson,loadDetails,loadIndex} from '../../lib/web-data.ts';
const response=value=>({ok:true,json:async()=>value});
const detail=id=>({id,entry:'Máster',funding:{kind:'salary',text:'Consultar convocatoria'}});

test('one unavailable detail preserves the other cards and can be retried',async t=>{
 const calls=[];let recovered=false;
 t.mock.method(globalThis,'fetch',async url=>{calls.push(url);if(url.endsWith('detail-failed.json')&&!recovered)throw new Error('offline');return response(detail(url.endsWith('detail-failed.json')?'failed':'ok'));});
 const paths=['data/detail-ok.json','data/detail-failed.json'];
 const first=await loadDetails(paths);
 assert.deepEqual(Object.keys(first.records),[paths[0]]);
 assert.deepEqual(first.failedPaths,[paths[1]]);
 recovered=true;
 const second=await loadDetails(paths);
 assert.deepEqual(Object.keys(second.records),paths);
 assert.deepEqual(second.failedPaths,[]);
 assert.equal(calls.filter(url=>url.endsWith('detail-ok.json')).length,1,'successful cards keep their cached conditions');
 assert.equal(calls.filter(url=>url.endsWith('detail-failed.json')).length,2,'only a failed request must be repeated');
});

test('a late failed request cannot evict the newer successful response',async t=>{
 let failFirst;let calls=0;
 t.mock.method(globalThis,'fetch',()=>{calls++;return calls===1?new Promise((_,reject)=>{failFirst=reject;}):Promise.resolve(response({version:2}));});
 const older=readJson('data/cache-race.json');
 const newer=await readJson('data/cache-race.json',true);
 failFirst(new Error('old connection failed'));
 await assert.rejects(older);
 assert.equal(newer.version,2);
 assert.equal((await readJson('data/cache-race.json')).version,2);
 assert.equal(calls,2,'the fresh response must remain cached');
});

test('details are separated by edition path and explicit refresh fetches again',async t=>{
 let calls=0;
 t.mock.method(globalThis,'fetch',async url=>{calls++;return response({...detail('same-id'),entry:url.endsWith('v2.json')?'Doctorado':'Máster'});});
 const old=await loadDetails(['data/edition-v1.json']);
 const updated=await loadDetails(['data/edition-v2.json']);
 assert.equal(old.records['data/edition-v1.json'].entry,'Máster');
 assert.equal(updated.records['data/edition-v2.json'].entry,'Doctorado');
 await loadDetails(['data/edition-v2.json'],true);
 assert.equal(calls,3);
});

test('malformed detail and manifest data are reported as unavailable',async t=>{
 t.mock.method(globalThis,'fetch',async ()=>response({}));
 assert.deepEqual((await loadDetails(['data/invalid-detail.json'])).failedPaths,['data/invalid-detail.json']);
 await assert.rejects(loadIndex('sources',true),/Índice no disponible/);
});
