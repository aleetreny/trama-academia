import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {countryPair} from '../../lib/country-pair.ts';
const guides=JSON.parse(await fs.readFile(new URL('../../data/country-guides.json',import.meta.url),'utf8'));
const codes=guides.map(c=>c.code);
test('country comparison rejects unknown codes and keeps two distinct countries',()=>{
 assert.deepEqual(countryPair(new URLSearchParams('pais1=XX&pais2=YY'),codes),['ES','GB']);
 assert.deepEqual(countryPair(new URLSearchParams('pais1=FR&pais2=DK'),codes),['FR','DK']);
 assert.notEqual(...countryPair(new URLSearchParams('pais1=GB&pais2=GB'),codes));
});
test('country facts always resolve to visible, dated sources and unique static routes',()=>{
 assert.equal(new Set(codes).size,31);
 for(const c of guides){
  for(const key of ['model','admission','duration','pay','fees','supervision','assessment','watch']){
   assert.ok(c.facts[key]?.length>20,c.code+' '+key);
   for(const n of c.factSources[key]||[1])assert.ok(c.sources[n-1]?.url,c.code+' '+key+' source '+n);
  }
  for(const s of c.sources){assert.match(s.url,/^https:\/\//);assert.ok(Number.isFinite(Date.parse(s.checkedAt)));assert.ok(s.scope);}
 }
});
