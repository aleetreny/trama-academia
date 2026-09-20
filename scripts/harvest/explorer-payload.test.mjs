import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {explorerCatalogue} from '../../lib/explorer-data.ts';
import {statusOf} from '../../lib/types.ts';
const catalogue=JSON.parse(fs.readFileSync(new URL('../../data/catalogue.json',import.meta.url)));

test('listing payload keeps every filter, card and comparison value without altering full records',()=>{
 const before=JSON.stringify(catalogue),ids=new Set();
 const fields=['id','kind','stage','eligibleStages','title','institution','country','city','verifiedAt','deadline','fields','funding','entry','duration','contract','feeNote','lastError'];
 for(const funding of [false,true]){
  const listing=explorerCatalogue(catalogue,funding);
  assert.equal(listing.generatedAt,catalogue.generatedAt);
  const expected=catalogue.records.filter(r=>r.kind.includes('funding')===funding);
  assert.equal(listing.records.length,expected.length);
  for(let n=0;n<expected.length;n++){
   const record=listing.records[n],original=expected[n];
   assert(!ids.has(record.id));ids.add(record.id);
   for(const key of fields)assert.deepEqual(record[key],original[key]);
   assert.equal(statusOf(record,Date.parse('2026-09-20')),statusOf(original,Date.parse('2026-09-20')));
   assert.equal(record.evidence,undefined);
  }
 }
 assert.equal(ids.size,catalogue.records.length);assert.equal(JSON.stringify(catalogue),before);
});

test('European catalogue fits bounded listing payloads as its evidence grows',()=>{
 const full=Buffer.byteLength(JSON.stringify(catalogue));
 for(const funding of [false,true]){
  const payload=JSON.stringify(explorerCatalogue(catalogue,funding));
  assert(Buffer.byteLength(payload)<full*.5,'Listing must stay below half the full evidence catalogue');
  assert.deepEqual(JSON.parse(payload),explorerCatalogue(catalogue,funding));
 }
});
