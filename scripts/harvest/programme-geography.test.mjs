import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyProgramme,mergeProgrammeRecords} from './programme-record.mjs';
import {isEuropeanDestination} from './programme-geography.mjs';

const url='https://example.edu/computer-science',contact='https://example.edu/informatics/contact';
const seed={title:'Computer Science MSc',institution:'Example University',country:'TR',url,kind:'programme',stage:'master',entry:'Bachelor degree',fields:['Informática'],researchEvidenceUrl:url,evidencePages:[{url:contact,label:'Informatics Institute campus'}],geography:{scope:'european-campus',areaId:'tr-istanbul-europe',campus:'Informatics Institute, Ayazağa / Sarıyer',city:'Istanbul',evidenceUrls:[contact],programmeEvidenceUrl:url},evidenceChecks:[{field:'campus-programme',url,phrases:['The Computer Science MSc is taught at the Informatics Institute.']},{field:'campus',url:contact,phrases:['Informatics Institute — Ayazağa, Sarıyer, Istanbul.']}]};
const fetcher=(campus='Ayazağa, Sarıyer, Istanbul',unit='Informatics Institute')=>async target=>({body:'<main>'+('Computer science research and a master thesis. '.repeat(6))+(target===url?`The Computer Science MSc is taught at the ${unit}.`:`Informatics Institute — ${campus}.`)+'</main>',finalUrl:target,hash:'checked-'+target,checkedAt:'2026-09-20T12:00:00Z'});

test('a transcontinental country alone cannot admit a programme or vacancy',async()=>{
 let fetched=false;
 await assert.rejects(verifyProgramme({...seed,geography:undefined},async()=>{fetched=true;}),/european_campus_review_required/);
 assert.equal(fetched,false);
 assert.equal(isEuropeanDestination({country:'TR',kind:'vacancy',geography:seed.geography}),false);
 await assert.rejects(verifyProgramme({...seed,kind:'funding-programme'},fetcher()),/european_campus_review_required/);
 await assert.rejects(verifyProgramme({...seed,country:'KZ'},fetcher()),/european_campus_review_required/);
 await assert.rejects(verifyProgramme({...seed,country:'US'},fetcher()),/non_european_destination/);
});

test('a European address needs a witnessed link to the programme teaching unit',async()=>{
 await assert.rejects(verifyProgramme({...seed,evidenceChecks:seed.evidenceChecks.filter(c=>c.field==='campus')},fetcher()),/programme_campus_association_missing/);
 await assert.rejects(verifyProgramme({...seed,geography:{...seed.geography,programmeEvidenceUrl:contact}},fetcher()),/programme_campus_association_missing/);
 await assert.rejects(verifyProgramme(seed,fetcher(undefined,'School of Maritime Studies in Tuzla')),/evidence_changed: campus-programme/);
 const record=await verifyProgramme(seed,fetcher());
 assert.equal(record.city,'Istanbul');
 assert.equal(record.evidence.geography.programme.url,url);
 assert.equal(record.evidence.geography.locations[0].url,contact);
 assert.equal(isEuropeanDestination(record),true);
});

test('Istanbul alone is ambiguous and an Asian campus cannot reuse the exemption',async()=>{
 const candidate={...seed,evidenceChecks:[seed.evidenceChecks[0],{field:'campus',url:contact,phrases:['Istanbul']} ]};
 await assert.rejects(verifyProgramme(candidate,fetcher()),/european_campus_location_missing/);
 const old=await verifyProgramme(seed,fetcher());
 await assert.rejects(verifyProgramme(seed,fetcher('Tuzla, Istanbul')),/evidence_changed: campus/);
 const [preserved]=mergeProgrammeRecords([old],[],[{id:old.sourceId,status:'partial',report:{errors:[{error:'evidence_changed: campus'}]}}]);
 assert.equal(preserved.status,'unverified');assert.equal(preserved.verifiedAt,old.verifiedAt);
 assert.equal(preserved.evidence.geography.locations[0].contentHash,old.evidence.geography.locations[0].contentHash);
});

test('publication requires geography provenance from the actual checked documents',async()=>{
 const record=await verifyProgramme(seed,fetcher());
 assert.equal(isEuropeanDestination({...record,evidence:{...record.evidence,geography:undefined}}),false);
 const altered=structuredClone(record);altered.evidence.geography.locations[0].contentHash='unrelated-document';
 assert.equal(isEuropeanDestination(altered),false);
 assert.equal(isEuropeanDestination({...record,country:'RU'}),false);
 assert.equal(isEuropeanDestination({...record,city:'Ankara'}),false);
 assert.equal(isEuropeanDestination({...record,geography:{...record.geography,evidenceUrls:[contact,contact]}}),false);
});
