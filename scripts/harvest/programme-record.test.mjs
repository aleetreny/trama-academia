import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyProgramme,mergeProgrammeRecords} from './programme-record.mjs';

const seed={title:'Summer research in Computer Science',institution:'Test university',country:'CH',url:'https://example.edu/summer',kind:'programme',stage:'grado',entry:'Grado en curso',fields:['Informática'],duration:'8 semanas',funding:{kind:'scholarship',text:'94 CHF por día'},evidencePages:[{url:'https://example.edu/conditions',label:'Condiciones'}],evidenceChecks:[{field:'funding',url:'https://example.edu/conditions',phrases:['94 CHF per calendar day']}]};
function fetcher(amount='94'){return async url=>({body:'<main>'+('Computer science research supervised by faculty. '.repeat(6))+(url.endsWith('/conditions')?amount+' CHF per calendar day.':'')+'</main>',finalUrl:url,hash:'hash-'+url,checkedAt:url.endsWith('/conditions')?'2026-09-18T10:00:00Z':'2026-09-19T10:00:00Z'});}
test('programme conditions are tied to their own source and the oldest supporting check',async()=>{
 const r=await verifyProgramme(seed,fetcher());
 assert.equal(r.verifiedAt,'2026-09-18T10:00:00Z');assert.equal(r.status,'programme');assert.equal(r.deadline,null);
 assert.equal(r.evidence.references.length,2);assert.equal(r.evidence.references[1].label,'Condiciones');assert.equal(r.evidenceChecks,undefined);
});
test('a changed allowance cannot refresh the old editorial amount as verified',async()=>{
 const old=await verifyProgramme(seed,fetcher());
 await assert.rejects(verifyProgramme(seed,fetcher('96')),/evidence_changed: funding/);
 const [preserved]=mergeProgrammeRecords([old],[],[{id:old.sourceId,status:'partial',report:{errors:[{error:'evidence_changed: funding'}]}}]);
 assert.equal(preserved.funding.text,'94 CHF por día');assert.equal(preserved.verifiedAt,old.verifiedAt);assert.equal(preserved.status,'unverified');assert.equal(preserved.lastError,'evidence_changed: funding');assert.equal(old.status,'programme');
});
test('programme research and discipline cannot come only from navigation or the seed title',async()=>{
 await assert.rejects(verifyProgramme({...seed,stage:'master',evidencePages:[],evidenceChecks:[]},async url=>({body:'<nav>Thesis</nav><main>'+'Computer science lectures and practical classes. '.repeat(7)+'</main>',finalUrl:url,hash:'x',checkedAt:'2026-09-19'})),/research_component_unverified/);
 await assert.rejects(verifyProgramme({...seed,evidencePages:[],evidenceChecks:[]},async url=>({body:'<main>'+'General university admissions and student services. '.repeat(7)+'</main>',finalUrl:url,hash:'x',checkedAt:'2026-09-19'})),/discipline_unverified/);
});
test('missing supporting evidence never creates a new programme from an unverified seed',async()=>{
 await assert.rejects(verifyProgramme(seed,async url=>{if(url.endsWith('/conditions'))throw new Error('http_403');return fetcher()(url);}),/http_403/);
 assert.deepEqual(mergeProgrammeRecords([],[],[{id:'programme-new',status:'partial',report:{errors:[{error:'http_403'}]}}]),[]);
});
