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
 await assert.rejects(verifyProgramme({...seed,fields:undefined,evidencePages:[],evidenceChecks:[]},async url=>({body:'<main>'+'General university admissions and student services. '.repeat(7)+'</main>',finalUrl:url,hash:'x',checkedAt:'2026-09-19'})),/discipline_unverified/);
});
test('missing supporting evidence never creates a new programme from an unverified seed',async()=>{
 await assert.rejects(verifyProgramme(seed,async url=>{if(url.endsWith('/conditions'))throw new Error('http_403');return fetcher()(url);}),/http_403/);
 assert.deepEqual(mergeProgrammeRecords([],[],[{id:'programme-new',status:'partial',report:{errors:[{error:'http_403'}]}}]),[]);
});
test('a PDF used as the research reference retains its declared transport format',async()=>{
 const url='https://example.edu/curriculum.pdf';let observed;
 await assert.rejects(verifyProgramme({...seed,researchEvidenceUrl:url,evidencePages:[{url,format:'pdf',label:'Curriculum'}]},async (requested,options)=>{
  if(requested===url){observed=options.format;throw new Error('pdf_transport_reached');}return fetcher()(requested);
 }),/pdf_transport_reached/);
 assert.equal(observed,'pdf');
});
test('an explicitly reviewed registry keeps the human programme URL and rejects a withdrawn approval',async()=>{
 const api='https://example.edu/api/program/CS',candidate={...seed,stage:'master',primaryEvidenceUrl:api,evidencePages:[{url:api,label:'Official programme register'}],evidenceChecks:[{field:'Approval',phrases:['"id":"CS"','"status":"approved"']}]} ;
 const requested=[],fetchRegistry=(status='approved')=>async url=>{
  requested.push(url);if(url!==api)throw new Error('unexpected_url');
  return {body:JSON.stringify({id:'CS',status,text:'Computer science research and a master thesis. '.repeat(8)}),finalUrl:api,hash:'registry-hash',checkedAt:'2026-09-19'};
 };
 const record=await verifyProgramme(candidate,fetchRegistry());
 assert.equal(record.url,seed.url);assert.equal(record.applyUrl,seed.url);assert.equal(record.evidence.checkedUrl,api);assert.equal(record.evidence.method,'official-programme-registry');assert.equal(record.primaryEvidenceUrl,undefined);assert.deepEqual(requested,[api]);
 await assert.rejects(verifyProgramme(candidate,fetchRegistry('withdrawn')),/evidence_changed: Approval/);
 await assert.rejects(verifyProgramme({...candidate,evidencePages:[]},fetchRegistry()),/primary_evidence_must_be_declared/);
});
