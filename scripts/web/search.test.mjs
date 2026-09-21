import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,readFilters,filterQuery,selectRecords} from '../../lib/search.ts';
import {createInstitutionMatcher} from './research-match.mjs';
const now=Date.parse('2026-09-21T12:00:00Z');
const metric=(score,tier='T1')=>({score,tier,volume:100,top10Share:.2});
const record=(id,extra={})=>({id,title:id,institution:'University '+id,country:'ES',kind:'position',stage:'doctorado',fields:['Informática'],status:'open',verifiedAt:'2026-09-21',deadline:'2026-09-22',languages:['Inglés'],funding:{kind:'salary'},researchInstitutionId:id,...extra});
const data={records:[record('a'),record('b'),record('c'),record('d')],institutions:{a:{metrics:{cs:metric(10,'T4'),ml:metric(90)}},b:{metrics:{cs:metric(90),ml:metric(10,'T4')}},c:{metrics:{}},d:{metrics:{cs:metric(0,'T4')}}}};
test('selected discipline changes ranking; measured zero precedes unknown',()=>{
 assert.deepEqual(selectRecords(data,defaults,now).map(x=>x.id),['b','a','d','c']);
 assert.deepEqual(selectRecords(data,{...defaults,subject:'ml'},now).map(x=>x.id),['a','b','c','d']);
 assert.deepEqual(selectRecords(data,{...defaults,tier:'unranked'},now).map(x=>x.id),['c']);
});
test('combined constraints and shared URL preserve semantics',()=>{
 const f={...defaults,tier:'T1',stage:'doctorado',country:'ES',funding:'salary',language:'english',closing:'7',q:'university b'};
 assert.deepEqual(readFilters(filterQuery(f)),f);
 assert.deepEqual(selectRecords(data,f,now).map(x=>x.id),['b']);
 assert.deepEqual(readFilters(new URLSearchParams('pagina=-1&tier=invented&orden=garbage')),defaults);
});
test('day precision includes today, and expired or unverified calls stay out',()=>{
 const input={...data,records:[record('today',{deadline:'2026-09-21'}),record('old',{deadline:'2026-09-20'}),record('stale',{verifiedAt:'2026-08-01'}),record('error',{lastError:'access failure'})]};
 assert.deepEqual(selectRecords(input,{...defaults,closing:'7'},now).map(x=>x.id),['today']);
});
test('funding eligible stages and accent-insensitive multiword search',()=>{
 const input={...data,records:[record('beca',{title:'Beca estadística',kind:'funding-programme',stage:'master',eligibleStages:['doctorado'],funding:{kind:'scholarship'}})]};
 assert.equal(selectRecords(input,{...defaults,stage:'doctorado',q:'estadistica beca',funding:'scholarship'},now).length,1);
});
const institution=(id,name,country='ES',domain='university.es')=>({id,name,country,aliases:[],domains:[domain],officialUrl:'https://'+domain});
test('identity matching respects country, aliases and unique official domains',()=>{
 const match=createInstitutionMatcher([{...institution('a','Universidad Única'),aliases:['Unique University']}]);
 assert.equal(match({country:'ES',institution:'Universidad Unica'})?.institution.id,'a');
 assert.equal(match({country:'ES',institution:'Unique University'})?.method,'name-country');
 assert.equal(match({country:'ES',institution:'Unlisted name',url:'https://admissions.university.es/course'})?.method,'official-domain-country');
 assert.equal(match({country:'GB',institution:'Unique University',url:'https://university.es'}),null);
});
test('ambiguous identities and joint institutions never inherit a partner tier',()=>{
 const match=createInstitutionMatcher([institution('a','Shared University'),institution('b','Shared University')]);
 assert.equal(match({country:'ES',institution:'Shared University',url:'https://university.es'}),null);
 assert.equal(match({country:'ES',institution:'Unknown',url:'https://university.es'}),null);
 const unique=createInstitutionMatcher([institution('a','Unique University')]);
 assert.equal(unique({country:'ES',institution:'Unique University — Partner University',url:'https://university.es'}),null);
 assert.equal(unique({country:'ES',institution:'External',url:'https://university.es.evil.test'}),null);
});
