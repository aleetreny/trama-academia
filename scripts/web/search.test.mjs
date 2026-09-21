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

test('funder country is independent of study destination and never inferred from it',()=>{
 const input={records:[
  record('spanish-abroad',{kind:'funding-programme',country:'EU',funderCountry:'ES'}),
  record('spanish-local',{kind:'funding-programme',country:'ES',funderCountry:'ES'}),
  record('foreign-local',{kind:'funding-programme',country:'ES',funderCountry:'DE'}),
  record('unknown',{kind:'funding-programme',country:'ES'}),
 ],institutions:{}};
 const ids=f=>selectRecords(input,{...defaults,...f},now).map(r=>r.id).sort();
 assert.deepEqual(ids({funderCountry:'ES'}),['spanish-abroad','spanish-local']);
 assert.deepEqual(ids({country:'ES',funderCountry:'ES'}),['spanish-local']);
 assert.deepEqual(ids({funderCountry:'unknown'}),['unknown']);
 const f={...defaults,funderCountry:'ES',country:'EU',stage:'master'};
 assert.deepEqual(readFilters(filterQuery(f)),f);
 assert.equal(filterQuery(f).get('financiador'),'ES');
 assert.equal(readFilters(new URLSearchParams('financiador=invented')).funderCountry,'all');
});

test('named multi-country funding destinations match individually without treating EU as every country',()=>{
 const input={records:[
  record('ibera',{kind:'funding-programme',country:'EU',destinationCountries:['ES','PT'],funderCountry:'ES'}),
  record('broad',{kind:'funding-programme',country:'EU',funderCountry:'ES'}),
 ],institutions:{}};
 for(const country of ['ES','PT']) assert.deepEqual(selectRecords(input,{...defaults,country},now).map(r=>r.id),['ibera']);
 assert.equal(selectRecords(input,{...defaults,country:'FR'},now).length,0);
 assert.equal(selectRecords(input,{...defaults,country:'EU'},now).length,2);
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

test('master degree filter excludes internships eligible for masters students',()=>{
 const input={...data,records:[record('degree',{kind:'programme',stage:'master'}),record('internship',{kind:'programme',stage:'grado',eligibleStages:['grado','master']})]};
 const f=readFilters(new URLSearchParams('etapa=master&tipo=master-programme&vigencia=programme'));
 assert.deepEqual(selectRecords(input,f,now).map(x=>x.id),['degree']);
});

test('measured zero sorts before missing impact or volume, without inventing a zero',()=>{
 const input={records:[record('a-missing'),record('z-zero'),record('non-finite')],institutions:{
  'a-missing':{metrics:{cs:{...metric(10),top10Share:null,volume:null}}},
  'z-zero':{metrics:{cs:{...metric(10),top10Share:0,volume:0}}},
  'non-finite':{metrics:{cs:{...metric(10),top10Share:NaN,volume:Infinity}}},
 }};
 for(const sort of ['impact','volume'])assert.deepEqual(selectRecords(input,{...defaults,sort},now).map(r=>r.id),['z-zero','a-missing','non-finite']);
});

test('a summer school accessible to masters students is not a masters degree',()=>{
 const input={...data,records:[record('degree',{kind:'programme',stage:'master'}),record('school',{kind:'programme',stage:'master',recurrence:{category:'summer-school'}})]};
 assert.deepEqual(selectRecords(input,{...defaults,kind:'master-programme'},now).map(r=>r.id),['degree']);
 assert.equal(selectRecords(input,{...defaults,stage:'master',kind:'programme'},now).length,2);
});

test('AI equivalents match titles and fields, not Italy, institutions or generic data science',()=>{
 const input={records:[
  record('english',{title:'MSc Artificial Intelligence',institution:'ETH Zürich'}),
  record('spanish',{title:'Máster en Inteligencia Artificial'}),
  record('short',{title:'Responsible AI'}),
  record('field',{title:'Advanced methods',fields:['Inteligencia artificial']}),
  record('italy',{title:'Mathematical Engineering',institution:'University of Padua',country:'IT',fields:['Matemáticas aplicadas']}),
  record('institution-only',{title:'Mathematics',institution:'Artificial Intelligence Institute'}),
  record('data-science',{title:'Data Science',fields:['Ciencia de datos']}),
  record('machine-learning',{title:'Machine Learning',fields:['Machine learning']}),
 ],institutions:{}};
 for(const q of ['IA','ai','inteligencia artificial','artificial intelligence']){
  assert.deepEqual(selectRecords(input,{...defaults,q},now).map(r=>r.id).sort(),['english','field','short','spanish']);
 }
 assert.deepEqual(selectRecords(input,{...defaults,q:'inteligencia artificial ETH zurich'},now).map(r=>r.id),['english']);
});

test('ML equivalents stay within titles and fields and never match HTML substrings',()=>{
 const input={records:[
  record('english',{title:'MSc Machine Learning'}),
  record('spanish',{title:'Aprendizaje automático avanzado'}),
  record('short',{title:'ML for health'}),
  record('field',{title:'Statistical methods',fields:['Machine learning']}),
  record('html',{title:'HTML systems'}),
  record('institution-only',{title:'Mathematics',institution:'Machine Learning Institute'}),
  record('data-science',{title:'Data Science',fields:['Ciencia de datos']}),
  record('ai-only',{title:'Artificial Intelligence',fields:['Informática']}),
 ],institutions:{}};
 for(const q of ['ML','machine learning','aprendizaje automático']){
  assert.deepEqual(selectRecords(input,{...defaults,q},now).map(r=>r.id).sort(),['english','field','short','spanish']);
 }
});

test('short terms use word boundaries while ETH names, accents and longer partial terms still work',()=>{
 const input={records:[
  record('eth',{title:'Statistics',institution:'ETH Zürich'}),
  record('methods',{title:'Methods in Zürich'}),
  record('ra',{title:'RA in statistics'}),
  record('transformation',{title:'Transformation of matter'}),
  record('phd',{title:'PhD in statistics'}),
  record('embedded-phd',{title:'GraphDB systems',institution:'Example University'}),
  record('ds',{title:'DS methods'}),
  record('data-science',{title:'Data Science',fields:['Ciencia de datos']}),
 ],institutions:{}};
 const ids=q=>selectRecords(input,{...defaults,q},now).map(r=>r.id).sort();
 assert.deepEqual(ids('eth zurich'),['eth']);
 assert.deepEqual(ids('RA'),['ra']);
 assert.deepEqual(ids('PhD'),['phd']);
 assert.deepEqual(ids('DS'),['ds']);
 assert.deepEqual(ids('statist'),['eth','phd','ra']);
 assert.equal(ids('   ').length,input.records.length);
});
