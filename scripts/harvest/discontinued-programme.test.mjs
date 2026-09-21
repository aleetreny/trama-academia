import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyProgramme,mergeProgrammeRecords} from './programme-record.mjs';
const seed={title:'MSc Applied Mathematics',institution:'Example university',country:'RO',url:'https://example.edu/applied-mathematics',kind:'programme',stage:'master',entry:'Máster',fields:['Matemáticas aplicadas']};
const fetchPage=notice=>async url=>({body:'<main><h1>Applied Mathematics</h1><p>'+notice+'</p>'+('Applied Mathematics: research methods, master thesis and supervised mathematical research. '.repeat(5))+'</main>',finalUrl:url,hash:'test',checkedAt:'2026-09-21'});
test('an archived degree with thesis evidence is not revalidated as a current programme',async()=>{
 const old=await verifyProgramme(seed,fetchPage('Annual applications are closed.'));
 await assert.rejects(verifyProgramme(seed,fetchPage('This study programme is no longer available.')),/programme_discontinued/);
 const [kept]=mergeProgrammeRecords([old],[],[{id:old.sourceId,status:'partial',report:{errors:[{error:'programme_discontinued'}]}}]);
 assert.equal(kept.verifiedAt,old.verifiedAt);assert.equal(kept.researchNote,old.researchNote);assert.equal(kept.status,'unverified');
});
