import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyProgramme,mergeProgrammeRecords} from './programme-record.mjs';
import {programmeText,hasResearchComponent} from './programme-evidence.mjs';

const seed={title:'Summer research in Computer Science',institution:'Test university',country:'CH',url:'https://example.edu/summer',kind:'programme',stage:'grado',entry:'Grado en curso',fields:['Informática'],duration:'8 semanas',funding:{kind:'scholarship',text:'94 CHF por día'},evidencePages:[{url:'https://example.edu/conditions',label:'Condiciones'}],evidenceChecks:[{field:'funding',url:'https://example.edu/conditions',phrases:['94 CHF per calendar day']}]};
test('an unknown career stage is rejected before fetching or publishing a programme',async()=>{
 await assert.rejects(verifyProgramme({...seed,stage:'phd'},async()=>{throw new Error('must_not_fetch');}),/invalid_programme_stage/);
});
test('a supporting curriculum must remain linked from the declared official source',async()=>{
 const candidate={...seed,evidencePages:[],evidenceChecks:[{field:'Linked curriculum',links:['https://example.edu/plan-2022.pdf']}]};
 const page=async target=>({...await fetcher()(target),body:'<main>'+('Computer science research. '.repeat(10))+'<a href="/plan-2022.pdf?utm_source=menu">Curriculum</a></main>'});
 assert.equal((await verifyProgramme(candidate,page)).title,seed.title);
 await assert.rejects(verifyProgramme(candidate,async target=>({...await page(target),body:(await page(target)).body.replace('plan-2022.pdf','plan-2023.pdf')})),/evidence_link_changed: Linked curriculum/);
});
function fetcher(amount='94'){return async url=>({body:'<main>'+('Computer science research supervised by faculty. '.repeat(6))+(url.endsWith('/conditions')?amount+' CHF per calendar day.':'')+'</main>',finalUrl:url,hash:'hash-'+url,checkedAt:url.endsWith('/conditions')?'2026-09-18T10:00:00Z':'2026-09-19T10:00:00Z'});}
test('programme conditions are tied to their own source and the oldest supporting check',async()=>{
 const r=await verifyProgramme(seed,fetcher());
 assert.equal(r.verifiedAt,'2026-09-18T10:00:00Z');assert.equal(r.status,'programme');assert.equal(r.deadline,null);
 assert.equal(r.evidence.references.length,2);assert.equal(r.evidence.references[1].label,'Condiciones');assert.equal(r.evidenceChecks,undefined);
});
test('unlabelled supporting documents publish their heading or an official-source label',async()=>{
 const page=async url=>({...await fetcher()(url),body:'<h1>International tuition fee support</h1>'+(await fetcher()(url)).body});
 for(const label of [undefined,'','  ',null,'undefined']){
  const candidate={...seed,evidencePages:[{url:'https://example.edu/conditions',label}]};
  assert.equal((await verifyProgramme(candidate,page)).evidence.references[1].label,'International tuition fee support');
 }
 const candidate={...seed,evidencePages:[{url:'https://example.edu/conditions'}]};
 const record=await verifyProgramme(candidate,fetcher());
 assert.equal(record.evidence.references[1].label,'Documento oficial · example.edu');
 assert.equal(record.evidence.references[0].label,'Información del programa');
});
test('a scholarship for master students is a funding scheme, not a research degree',async()=>{
 const r=await verifyProgramme({...seed,kind:'funding-programme',stage:'master',eligibleStages:['master','doctorado']},fetcher());
 assert.equal(r.programmeType,'Programa de financiación');
 assert.deepEqual(r.eligibleStages,['master','doctorado']);
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
test('contact-form degree options cannot supply research or discipline while genuine content inside a form survives',async()=>{
 const candidate={...seed,stage:'master',evidencePages:[],evidenceChecks:[]};
 const page=body=>async url=>({body,finalUrl:url,hash:'x',checkedAt:'2026-09-20'});
 const fakeResearch='<main>'+('Computer science lectures and practical classes. '.repeat(7))+'<form><select><option>Master thesis</option></select></form></main>';
 await assert.rejects(verifyProgramme(candidate,page(fakeResearch)),/research_component_unverified/);
 const fakeDiscipline='<main>'+('Geography lectures and a master thesis. '.repeat(7))+'<form><select><option>Computer Science MSc</option></select></form></main>';
 await assert.rejects(verifyProgramme(candidate,page(fakeDiscipline)),/discipline_unverified/);
 const valid='<form><main>'+('Computer science research and a master thesis. '.repeat(7))+'</main></form>';
 assert.equal((await verifyProgramme(candidate,page(valid))).status,'programme');
});
test('Bielefeld recent-page history cannot lend another degree its discipline or thesis',async()=>{
 const history='<div class="menulinks"><strong><a href="/sinfo/publ/Verlauf.jsp;jsessionid=example">Verlauf</a></strong><div class="linie"><a href="/sinfo/publ/master-as/datascience">Data Science master thesis</a></div></div>';
 const content='<div>'+('Geography lectures and practical classes. '.repeat(7))+'</div>';
 assert.equal(programmeText(history+content),programmeText(content));
 const candidate={...seed,stage:'master',evidencePages:[],evidenceChecks:[]};
 await assert.rejects(verifyProgramme(candidate,async url=>({body:history+content,finalUrl:url,hash:'x',checkedAt:'2026-09-20'})),/discipline_unverified|research_component_unverified/);
 const curriculum='<div class="menulinks"><strong><a href="/studium/studienverlauf">Studienverlauf</a></strong>Computer Science Master-Arbeit</div>';
 assert.match(programmeText(curriculum),/Computer Science Master-Arbeit/);
});
test('a visible page title outside main survives without admitting unrelated or hidden headings',()=>{
 const main='<main>Programme curriculum and admission requirements.</main>';
 assert.equal(programmeText('<div class="page-title-wrapper"><h1>Computer Science MSc</h1></div>'+main),'Computer Science MSc Programme curriculum and admission requirements.');
 for(const wrapper of ['nav','header','aside'])assert.equal(programmeText(`<${wrapper}><h1>Computer Science MSc</h1></${wrapper}>`+main),'Programme curriculum and admission requirements.');
 for(const attributes of ['hidden','aria-hidden="true"','style="display:none"'])assert.equal(programmeText(`<div ${attributes}><h1>Computer Science MSc</h1></div>`+main),'Programme curriculum and admission requirements.');
 assert.equal(programmeText('<h1>Generic university title</h1><main><h1>Mathematics MSc</h1>Curriculum</main>'),'Mathematics MScCurriculum');
});
test('Leeds academic key facts outside main retain the programme duration and admission requirements',()=>{
 const facts='<div class="uol-key-facts"><dl><dt>Duration</dt><dd>12 Months (Full time)</dd><dt>Entry requirements</dt><dd>Mathematics degree</dd></dl></div>';
 assert.equal(programmeText(facts+'<main>Research project</main>'),'Duration12 Months (Full time)Entry requirementsMathematics degree Research project');
 assert.equal(programmeText('<div hidden>'+facts+'</div><main>Research project</main>'),'Research project');
 assert.equal(programmeText('<nav>'+facts+'</nav><main>Research project</main>'),'Research project');
});
test('Liverpool course facts outside main preserve both study modes without taking sidebar or hidden facts',()=>{
 const facts='<dl class="rb-course-details"><div><dt>Study mode</dt><dd>Full-time</dd><dd>Part-time</dd></div><div><dt>Duration</dt><dd>12 months</dd><dd>24 months</dd></div><div><dt>Apply by:</dt><dd><time datetime="2026-09-18">18 September 2026</time></dd></div></dl>';
 const main='<main><h1>Advanced Computer Science MSc</h1><p>Independent research project.</p></main>';
 const text=programmeText(facts+main);
 assert.match(text,/Full-timePart-time/);
 assert.match(text,/Duration12 months24 months/);
 assert.match(text,/18 September 2026/);
 for(const attrs of ['hidden','aria-hidden="true"','style="display:none"','role="navigation"'])assert.doesNotMatch(programmeText('<div '+attrs+'>'+facts+'</div>'+main),/12 months|18 September/);
 assert.doesNotMatch(programmeText('<aside>'+facts+'</aside>'+main),/12 months/);
 assert.doesNotMatch(programmeText(facts+facts+main),/12 months/);
});
test('Oulu ARIA button disclosures retain their scholarship conditions without admitting hidden templates',()=>{
 const panel='<div role="region" aria-labelledby="nokia-button" id="nokia-content" hidden aria-hidden="true">Nokia scholarships of 3,000 euros for accepted Computer Science applicants.</div>';
 const button='<a role="button" id="nokia-button" aria-controls="nokia-content" aria-expanded="false" href="#nokia-content">Nokia Scholarship</a>';
 const text=programmeText('<main>'+button+panel+'</main>');
 assert.match(text,/3,000 euros/);
 assert.doesNotMatch(programmeText('<main><div hidden>'+button+'</div>'+panel+'Other funding</main>'),/3,000 euros/);
 assert.doesNotMatch(programmeText('<main>'+button+'<div id="unrelated" hidden>Unrelated scholarship</div>'+panel+'</main>'),/Unrelated scholarship/);
});
test('a business capstone replacing a dissertation does not verify a research route',()=>{
 assert.equal(hasResearchComponent('A final Major Applied Project instead of a traditional dissertation. Seminars and research skills training using live business datasets.'),false);
 assert.equal(hasResearchComponent('Develop a professional portfolio as an alternative to the traditional project thesis.'),false);
 assert.equal(hasResearchComponent('Professional Project: an individual project with a supervisor, linked to our computer vision research group, developing independent research and critical thinking.'),true);
 assert.equal(hasResearchComponent('Submit a dissertation or Engineering Project. Some students develop a professional portfolio as an alternative to the traditional project thesis.'),true);
});
test('a practicum requires an explicit academic route, as in DCU Computing',()=>{
 assert.equal(hasResearchComponent('A 30 ECTS practicum: an individual project may develop software or undertake rigorous theoretical analysis, proposing and evaluating alternative techniques.'),true);
 assert.equal(hasResearchComponent('A 30 ECTS practicum builds a prototype and develops research skills for business.'),false);
});
test('Czech thesis-defence rules retain the genitive diplomove prace without accepting a bachelor project',()=>{
 assert.equal(hasResearchComponent('Součástí státní závěrečné zkoušky je obhajoba diplomové práce a odborná rozprava.'),true);
 assert.equal(hasResearchComponent('Obhajoba diplomové práce ověřuje schopnost studenta samostatně zpracovat zadané téma a prezentovat vlastní výsledky.'),true);
 assert.equal(hasResearchComponent('Obhajoba bakalářské práce a odborná rozprava.'),false);
});
test('the Chemnitz curriculum spelling Master-Arbeit identifies its thesis module',()=>{
 assert.equal(hasResearchComponent('Forschungsseminar und Forschungspraktikum (3. Semester) Modul Master-Arbeit (4. Semester)'),true);
});
test('Fribourg travail de master identifies the final dissertation',()=>{
 assert.equal(hasResearchComponent('Le travail de master porte généralement sur un thème lié aux projets actuels de recherche ou de coopération avec des entreprises.'),true);
 assert.equal(hasResearchComponent('La seconde partie du programme est le travail de master, permettant de contribuer activement à des activités de recherche concrètes.'),true);
 assert.equal(hasResearchComponent('Préparer un travail de masterclass pour le cours.'),false);
});
test('Brest explicitly requires preparation and defence of a master dissertation',()=>{
 assert.equal(hasResearchComponent('выполнение научных исследований по избранной теме, подготовку к защите и защиту магистерской диссертации'),true);
 assert.equal(hasResearchComponent('Магистратура дает глубокие теоретические и практические навыки'),false);
});
test('a labelled admission score keeps its DOM boundary instead of absorbing the following heading number',async()=>{
 const candidate={...seed,evidencePages:[],evidenceChecks:[{field:'entry',labelledValues:[{container:'.basvuru-card',labelSelector:'.basvuru-card-title',valueSelector:'.basvuru-card-content',label:'Minimum Yabancı Dil Puanı',value:'50'}]}]};
 const page=(score='50')=>async url=>({...await fetcher()(url),body:'<main>'+('Computer science research. '.repeat(10))+`<div class="basvuru-card"><div class="basvuru-card-title">Minimum Yabancı Dil Puanı</div><div class="basvuru-card-content">${score}</div></div><h2>2. Curriculum</h2></main>`});
 assert.equal((await verifyProgramme(candidate,page())).status,'programme');
 await assert.rejects(verifyProgramme(candidate,page('55')),/evidence_value_changed: entry/);
 const wrong=structuredClone(candidate);wrong.evidenceChecks[0].labelledValues[0].value='502';
 await assert.rejects(verifyProgramme(wrong,page()),/evidence_value_changed: entry/);
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
