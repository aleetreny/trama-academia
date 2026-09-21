import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyProgramme,mergeProgrammeRecords} from './programme-record.mjs';
import {effectiveStatus} from './domain.mjs';

const seed={title:'Funded PhD in Computer Science',institution:'Test university',country:'CY',url:'https://example.edu/phd-call',kind:'position',stage:'doctorado',entry:'Bachelor or Master',fields:['Informática'],call:{sourceText:'Deadline: September 25, 2026',deadline:'2026-09-25'}};
const fetcher=(closing='Deadline: September 25, 2026')=>async url=>({body:'<main>'+closing+'. '+('Computer Science research supervised by faculty. '.repeat(8))+'</main>',finalUrl:url,hash:'original-proof',checkedAt:'2026-09-21T10:00:00Z'});

test('a witnessed dated call expires automatically while preserving its exact closing date',async()=>{
 const record=await verifyProgramme(seed,fetcher());
 assert.equal(record.kind,'position');assert.equal(record.deadline,'2026-09-25');assert.equal(record.deadlinePrecision,'date');
 assert.equal(record.evidence.method,'official-reviewed-call-page');assert.equal(record.call,undefined);
 assert.equal(effectiveStatus(record,Date.parse('2026-09-21T12:00:00Z')),'open');
 assert.equal(effectiveStatus(record,Date.parse('2026-09-26T00:00:00Z')),'closed');
});
test('changed closing text fails revalidation and preserves the previous evidence as unverified',async()=>{
 const old=await verifyProgramme(seed,fetcher());
 await assert.rejects(verifyProgramme(seed,fetcher('Deadline: October 16, 2026')),/call_evidence_missing/);
 const [record]=mergeProgrammeRecords([old],[],[{id:old.sourceId,status:'partial',report:{errors:[{error:'call_evidence_missing'}]}}]);
 assert.equal(record.deadline,old.deadline);assert.equal(record.verifiedAt,old.verifiedAt);assert.equal(effectiveStatus(record,Date.parse('2026-09-21')),'unverified');
});
test('opening dates, mismatched dates, invalid dates and unreviewed positions cannot become open calls',async()=>{
 await assert.rejects(verifyProgramme({...seed,call:undefined},fetcher()),/call_evidence_missing/);
 await assert.rejects(verifyProgramme({...seed,call:{...seed.call,deadline:'2026-09-26'}},fetcher()),/call_deadline_mismatch/);
 const intake='Intake: September 25, 2026';
 await assert.rejects(verifyProgramme({...seed,call:{...seed.call,sourceText:intake}},fetcher(intake)),/call_deadline_label_missing/);
 const impossible='Deadline: February 31, 2026';
 await assert.rejects(verifyProgramme({...seed,call:{sourceText:impossible,deadline:'2026-02-31'}},fetcher(impossible)),/call_deadline_mismatch/);
 await assert.rejects(verifyProgramme({...seed,kind:'programme'},fetcher()),/call_requires_position/);
});
test('rolling internships need an explicit witnessed statement and lose freshness after fourteen days',async()=>{
 const text='Applications are evaluated on a rolling basis throughout the year.';
 const candidate={...seed,stage:'grado',call:{rolling:true,sourceText:text}};
 const record=await verifyProgramme(candidate,fetcher(text));
 assert.equal(record.status,'rolling');assert.equal(record.deadline,null);
 assert.equal(effectiveStatus(record,Date.parse('2026-09-22')),'rolling');
 assert.equal(effectiveStatus(record,Date.parse('2026-10-06')),'unverified');
 await assert.rejects(verifyProgramme({...candidate,call:{...candidate.call,deadline:'2026-09-25'}},fetcher(text)),/invalid_rolling_call/);
});
