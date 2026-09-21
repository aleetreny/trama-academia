import test from 'node:test';
import assert from 'node:assert/strict';
import {parseEth} from './extra-adapters.mjs';
import {stageFrom} from './domain.mjs';
const source={id:'eth-jobs',name:'ETH Zurich · Vacantes'};
const page={checkedAt:'2026-09-21T12:00:00Z',hash:'review-fixture',finalUrl:'https://jobs.ethz.ch/job/view/example'};
const advert=({title,background='',duties='',profile='',german=false})=>`<h1 id="job-title">${title}</h1><div class="description"><h4>100%, Zürich, fixed-term</h4><section aria-label="${german?'Projekthintergrund':'Project background'}">${background}</section><section aria-label="${german?'Stellenbeschreibung':'Job description'}">${duties}</section><section aria-label="${german?'Profil':'Profile'}">${profile}</section><section aria-label="Neugierig? Sind wir auch.">Die Vorselektion wird durch die verantwortlichen Rekrutierenden und nicht durch künstliche Intelligenz durchgeführt.</section></div><a class="application__button--link" href="https://example.org/apply">Apply</a>`;
const parse=options=>parseEth(advert(options),page.finalUrl,source,page);

test('an office role at a research chair is not a faculty vacancy',()=>{
 const title='Office Manager at the Chair of Global Security';
 assert.equal(stageFrom(title),null);
 assert.equal(stageFrom('Administrative Officer at the Chair of Computer Science'),null);
 assert.equal(parse({title,background:'The Chair combines quantitative and computational approaches.',duties:'Budget monitoring, procurement, travel coordination, onboarding and calendar management.',profile:"Administrative vocational training or a Bachelor's degree."}),null);
 assert.equal(stageFrom('Research Chair in Computer Science'),'faculty');
 assert.equal(stageFrom('Research Group Leader in Machine Learning'),'faculty');
});

test('ETH recruitment boilerplate cannot supply a research discipline to a workshop role',()=>{
 assert.equal(parse({title:'Elektrotechniker oder Elektroingenieur (m/w/d)',german:true,background:'Leiter:in für unsere elektronische Werkstatt.',duties:'Sie bauen elektrische Anlagen, reparieren bestehende Anlagen und beschaffen die erforderlichen Komponenten.',profile:'Abgeschlossene Berufslehre (EFZ) oder Abschluss als Elektroingenieur.'}),null);
});

test('English and German role sections retain legitimate scientific engineering and chair positions',()=>{
 const english=parse({title:'Research Engineer',background:'The project develops new machine learning methods.',duties:'Design and evaluate algorithms for causal inference.',profile:'PhD or equivalent.'});
 assert.equal(english?.stage,'postdoc');assert.ok(english.fields.includes('Machine learning'));
 const german=parse({title:'Ingenieur für Forschung',german:true,duties:'Entwickeln und evaluieren Sie neue Algorithmen für maschinelles Lernen.',profile:'Masterabschluss.'});
 assert.equal(german?.stage,'grado');assert.ok(german.fields.includes('Machine learning'));
 const chair=parse({title:'Research Chair in Computer Science',duties:'Lead a research group developing software verification methods.',profile:'PhD.'});
 assert.equal(chair?.stage,'faculty');assert.ok(chair.fields.includes('Informática'));
});

test('ETH project regions named by a heading retain their scientific evidence',()=>{
 const html=advert({title:'Doctoral Position',duties:'Design experiments and publish results.'}).replace('<section aria-label="Project background"></section>','<h2 id="project-background">Project background</h2><section aria-labelledby="project-background">Research in human–computer interaction and virtual reality.</section>');
 assert.deepEqual(parseEth(html,page.finalUrl,source,page)?.fields,['Informática']);
});
