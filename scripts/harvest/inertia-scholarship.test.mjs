import test from 'node:test';
import assert from 'node:assert/strict';
import {inertiaScholarshipText} from './inertia-scholarship.mjs';
import {verifyProgramme} from './programme-record.mjs';
const url='https://www.fonds.lv/scholarships/46';
const record=()=>({component:'Public/Scholarships/Detail',url:'/scholarships/46',props:{appLocale:'lv',auth:{private:'ACCOUNT_SENTINEL'},scholarship:{id:46,published:1,name:{lv:'Doktorantūras stipendija',en:'Doctoral scholarship'},amount:{lv:'1200 EUR/mēn.',en:'1200 EUR/month'},excerpt:{lv:'Pirmā gada doktorantiem.',en:'First-year doctoral students.'},apply:[{name:{lv:'Pētījuma pieteikums',en:'Research proposal'}}],contents:[{type:'text',post_type:'scholarships',post_id:46,content:{lv:'<p>2026/2027: viens gads ar pagarinājumu.</p>',en:'<p>Three years.</p>'}},{type:'text',post_type:'scholarships',post_id:47,content:{lv:'UNRELATED_SCHOLARSHIP'}},{type:'file',post_type:'scholarships',post_id:46,content:{lv:'FILE_NOT_READ.pdf'}}],students:[{name:'RECIPIENT_SENTINEL',student_pid:'IDENTIFIER_SENTINEL'}],studentCategories:[{name:'HISTORICAL_EDITION_SENTINEL'}],patrons:[{email:'CONTACT_SENTINEL'}]}}});
const html=p=>'<div id="app" data-page="'+JSON.stringify(p).replaceAll('&','&amp;').replaceAll('"','&quot;')+'"></div>';
test('Inertia scholarship uses only its own public fields and requested translation',()=>{
 const p=record(),lv=inertiaScholarshipText(html(p),url,46),en=inertiaScholarshipText(html(p),url,46,'en');
 assert.match(lv,/2026\/2027: viens gads/);assert.match(lv,/1200 EUR\/mēn/);assert.doesNotMatch(lv,/Three years/);
 assert.match(en,/Three years/);assert.match(en,/Research proposal/);assert.doesNotMatch(en,/2026\/2027/);
 for(const text of [lv,en])assert.doesNotMatch(text,/SENTINEL|UNRELATED|FILE_NOT_READ/);
});
test('Inertia rejects index pages, stale identities, foreign routes and unpublished records',()=>{
 const p=record();assert.throws(()=>inertiaScholarshipText(html(p),url,47),/identity_mismatch/);
 for(const route of ['/scholarships/47','https://other.example/scholarships/46']){p.url=route;assert.throws(()=>inertiaScholarshipText(html(p),url,46),/identity_mismatch/);}
 p.url='/scholarships/46';p.component='Public/Scholarships/Index';assert.throws(()=>inertiaScholarshipText(html(p),url,46),/identity_mismatch/);
 p.component='Public/Scholarships/Detail';p.props.scholarship.published=0;assert.throws(()=>inertiaScholarshipText(html(p),url,46),/unpublished/);
});
test('Inertia cannot infer a missing translation or recover malformed payloads from other text',()=>{
 const p=record();delete p.props.scholarship.name.en;
 assert.throws(()=>inertiaScholarshipText(html(p),url,46,'en'),/translation_missing/);
 assert.throws(()=>inertiaScholarshipText(html(p),url,46,'de'),/language_unsupported/);
 assert.throws(()=>inertiaScholarshipText('<div id="app" data-page="invalid">Research scholarship</div>',url,46),/json_invalid/);
 assert.throws(()=>inertiaScholarshipText(html(record())+html(record()),url,46),/page_missing/);
});
test('native programme verification keeps the declared Inertia identity and language',async()=>{
 const p=record();p.props.scholarship.excerpt.en+=' The award supports supervised doctoral research and requires a research proposal, academic references and evidence of enrolment at the host university. Renewal is subject to review of research progress.';
 const seed={url,title:'Example doctoral scholarship',institution:'Example University Foundation',country:'LV',kind:'funding-programme',stage:'doctorado',evidencePages:[{url,format:'inertia-scholarship',scholarshipId:46,locale:'en',label:'Bases oficiales'}],evidenceChecks:[{field:'coverage',url,phrases:['1200 EUR/month','Three years.']}]};
 const result=await verifyProgramme(seed,async()=>({url,finalUrl:url,body:html(p),hash:'test-hash',checkedAt:'2026-09-20T15:00:00Z'}));
 assert.equal(result.evidence.method,'official-programme-embedded-data');assert.equal(result.evidence.references[0].label,'Bases oficiales');
 assert.doesNotMatch(JSON.stringify(result),/SENTINEL|UNRELATED|FILE_NOT_READ/);
 await assert.rejects(verifyProgramme({...seed,evidencePages:[{...seed.evidencePages[0],scholarshipId:47}]},async()=>({url,finalUrl:url,body:html(p)})),/identity_mismatch/);
});
test('translated evidence checks verify disagreement without borrowing words from the other language',async()=>{
 const p=record();p.props.scholarship.excerpt.lv+=' Doktorantūras atbalsts pētniecībai. '.repeat(10);
 const seed={url,title:'Example doctoral scholarship',institution:'Example University Foundation',country:'LV',kind:'funding-programme',stage:'doctorado',evidencePages:[{url,format:'inertia-scholarship',scholarshipId:46,locale:'lv',label:'Bases oficiales en letón'}],evidenceChecks:[{field:'Bases LV',phrases:['2026/2027: viens gads']},{field:'Discrepancia EN',locale:'en',phrases:['Three years.']}]};
 const page=async()=>({url,finalUrl:url,body:html(p),hash:'test-hash',checkedAt:'2026-09-20T15:00:00Z'});
 const result=await verifyProgramme(seed,page);assert.deepEqual(result.evidence.checks,['Bases LV','Discrepancia EN']);assert.doesNotMatch(JSON.stringify(result),/SENTINEL|UNRELATED/);
 await assert.rejects(verifyProgramme({...seed,evidenceChecks:[{field:'EN',locale:'en',phrases:['2026/2027: viens gads']}]},page),/evidence_changed/);
 await assert.rejects(verifyProgramme({...seed,evidenceChecks:[{field:'LV',phrases:['Three years.']}]},page),/evidence_changed/);
 await assert.rejects(verifyProgramme({...seed,evidenceChecks:[{field:'Unsupported',locale:'de',phrases:['Three years.']}]},page),/language_unsupported/);
 await assert.rejects(verifyProgramme({...seed,evidencePages:[],evidenceChecks:[{field:'Invalid reference',locale:'en',phrases:['Three years.']}]},async()=>({...await page(),body:'<main>'+('Doctoral research scholarship. '.repeat(10))+'</main>'})),/evidence_locale_check_invalid/);
});
