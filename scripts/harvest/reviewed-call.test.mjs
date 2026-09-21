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

const announcement='Ανταποδοτική Υποτροφία στο μάθημα «Αριθμητική Ανάλυση»';
const recruitment='Ζητούνται πέντε μεταπτυχιακοί φοιτητές για το 2026-2027.';
const indexUrl='https://example.edu/master';
const card=(date='14/09/2026',url=seed.url)=>`<div class="views-row"><div class="views-field-created"><span class="date">${date}</span></div><div class="views-field-title"><h5><a href="${url}">${announcement}</a></h5></div></div>`;
const undated={...seed,stage:'master',call:{listed:true,sourceText:recruitment,listing:{sourceUrl:indexUrl,title:announcement,date:'2026-09-14'}},evidencePages:[{url:indexUrl,label:'Dated institutional announcement index'}]};
const announcementFetcher=(index=card(),checkedAt='2026-09-21T10:00:00Z')=>async url=>({body:'<main>'+('Computer Science research opportunities. '.repeat(8))+(url===indexUrl?index:announcement+' '+recruitment)+'</main>',finalUrl:url,hash:'announcement-proof',checkedAt});

test('a recent undated announcement is listed with its publication date, never open or rolling',async()=>{
 const record=await verifyProgramme(undated,announcementFetcher());
 assert.equal(record.status,'listed');assert.equal(record.deadline,null);assert.equal(record.publishedAt,'2026-09-14T00:00:00Z');
 assert.match(record.deadlineNote,/14\/09\/2026.*sin fecha límite/);
 assert.equal(effectiveStatus(record,Date.parse('2026-09-22')),'listed');
 assert.equal(effectiveStatus(record,Date.parse('2026-10-06')),'unverified');
 await assert.rejects(verifyProgramme(undated,announcementFetcher(card(),'2026-10-15T00:00:00Z')),/call_listing_not_recent/);
});
test('undated calls require their own visible dated index card and cannot borrow another announcement date',async()=>{
 for(const html of [card('14/09/2026','https://example.edu/different-call'),'<nav>'+card()+'</nav>','<div hidden>'+card()+'</div>',card()+card(),card().replace('views-field-created','unrelated-date'),card().replace(announcement,'Another announcement'),card().replace('class="date"','class="date" hidden'),card().replace('class="date"','class="date" style="display: none"'),card().replace('<a href=','<a style="display:none" href=')]){
  await assert.rejects(verifyProgramme(undated,announcementFetcher(html)),/call_listing_date_missing/);
 }
 await assert.rejects(verifyProgramme({...undated,evidencePages:[]},announcementFetcher()),/invalid_undated_call/);
});
test('undated publication dates reject stale, future, impossible or changed dates and conflicting modes',async()=>{
 for(const [date,iso,error] of [['13/09/2026','2026-09-14','call_listing_date_mismatch'],['31/02/2026','2026-02-31','call_listing_date_mismatch'],['22/09/2026','2026-09-22','call_listing_not_recent']]){
  await assert.rejects(verifyProgramme({...undated,call:{...undated.call,listing:{...undated.call.listing,date:iso}}},announcementFetcher(card(date))),new RegExp(error));
 }
 for(const extra of [{rolling:true},{deadline:'2026-09-25'}])await assert.rejects(verifyProgramme({...undated,call:{...undated.call,...extra}},announcementFetcher()),/invalid_undated_call/);
 const changed=async url=>{const d=await announcementFetcher()(url);if(url===seed.url)d.body=d.body.replace(recruitment,'All places have been filled.');return d;};
 await assert.rejects(verifyProgramme(undated,changed),/call_evidence_missing/);
});

const exactIdentity='IC2026_07_04_BCAM Internship_Design and Implementation of a Real-Time Visualization System for Pedestrian Dynamics in Urban Environments';
const scopedCall=(sourceText='Deadline: September 28th 2026, 14:00 CEST',deadline='2026-09-28')=>({...seed,stage:'grado',call:{sourceText,deadline,scope:{container:'.offer',identitySelector:'.call-name',identityText:exactIdentity,deadlineSelector:'.closing'}}});
const offerBody=(text='Deadline: September 28th 2026, 14:00 CEST')=>`<section class="offer"><span class="call-name">${exactIdentity}</span><h3 class="closing">${text}</h3>${'Computer Science research and software development. '.repeat(8)}</section>`;
const scopedFetcher=body=>async url=>({body:'<main>'+body+'<p>'+('Computer Science research centre. '.repeat(8))+'</p></main>',finalUrl:url,hash:'scoped-proof',checkedAt:'2026-09-21T10:00:00Z'});

test('BCAM ordinal deadline retains date precision and its witnessed clock warning',async()=>{
 const record=await verifyProgramme(scopedCall(),scopedFetcher(offerBody()));
 assert.equal(record.deadline,'2026-09-28');assert.equal(record.deadlinePrecision,'date');
 assert.match(record.deadlineNote,/14:00 CEST.*confirma la hora/);
 assert.equal(effectiveStatus(record,Date.parse('2026-09-29')),'closed');
});
test('IMDEA application sentence supports a scoped ordinal date without borrowing the next sentence',async()=>{
 const text='Deadline for applications is September 30th, 2026.';
 const candidate=scopedCall(text,'2026-09-30');
 const record=await verifyProgramme(candidate,scopedFetcher(offerBody(text+' Review starts immediately.')));
 assert.equal(record.deadline,'2026-09-30');assert.equal(record.deadlineNote,undefined);
 await assert.rejects(verifyProgramme({...candidate,call:{...candidate.call,sourceText:text+' Review starts immediately.'}},scopedFetcher(offerBody(text+' Review starts immediately.'))),/call_deadline_label_missing/);
});
test('new deadline variants need one visible local identity and cannot borrow an adjacent offer date',async()=>{
 const candidate=scopedCall();
 await assert.rejects(verifyProgramme({...candidate,call:{...candidate.call,scope:undefined}},scopedFetcher(offerBody())),/call_deadline_scope_missing/);
 const elsewhere='<section class="other"><span>Another call</span><h3 class="closing">'+candidate.call.sourceText+'</h3></section>';
 const variants=[
  offerBody('Applications closed')+elsewhere,
  offerBody().replace(exactIdentity,'IC2026_07_03 Other internship'),
  offerBody()+offerBody(),
  offerBody().replace('class="offer"','class="offer" hidden'),
  offerBody().replace('class="call-name"','class="call-name" aria-hidden="true"'),
  offerBody().replace('class="closing"','class="closing" style="display:none"'),
  offerBody('<span hidden>'+candidate.call.sourceText+'</span>Applications closed')+elsewhere,
 ];
 for(const body of variants)await assert.rejects(verifyProgramme(candidate,scopedFetcher(body)),/call_(?:deadline_scope_mismatch|evidence_missing)/);
});
test('ordinal dates reject impossible days, wrong suffixes, invalid clocks and unrelated year text',async()=>{
 for(const [text,iso,error] of [
  ['Deadline: February 31st 2026','2026-02-31','call_deadline_mismatch'],
  ['Deadline: September 28st 2026','2026-09-28','call_deadline_mismatch'],
  ['Deadline: September 28th 2026, 25:00 CEST','2026-09-28','call_deadline_mismatch'],
  ['Deadline: September 28th 2026, 14:60 CEST','2026-09-28','call_deadline_mismatch'],
  ['Deadline: September 28th 2026, 14:00 PST','2026-09-28','call_deadline_label_missing'],
  ['Deadline: September 28th','2026-09-28','call_deadline_label_missing'],
  ['Intake: September 28th 2026','2026-09-28','call_deadline_label_missing'],
 ])await assert.rejects(verifyProgramme(scopedCall(text,iso),scopedFetcher(offerBody(text)+'<p>Published 2026</p>')),new RegExp(error));
});
