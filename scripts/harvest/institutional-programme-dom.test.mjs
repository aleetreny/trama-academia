import test from 'node:test';
import assert from 'node:assert/strict';
import {programmeText,hasResearchComponent} from './programme-evidence.mjs';
import {fieldsFrom} from './domain.mjs';

test('an Ametys module heading remains a separate thesis title from its credits',()=>{
 const html='<div><h1 class="ametys-main-banner-alt__title">Master Thesis</h1></div><div><h2>ECTS</h2><p>30 crédits</p></div>';
 assert.match(programmeText(html),/Master Thesis ECTS30 crédits/);
 assert.equal(hasResearchComponent(programmeText(html)),true);
 assert.equal(hasResearchComponent(programmeText('<nav>'+html+'</nav><main>Professional placement</main>')),false);
 assert.equal(hasResearchComponent(programmeText('<div hidden>'+html+'</div><main>Professional placement</main>')),false);
});

const admissions=(controlExtra='',regionExtra='',label='Non-Dutch degree')=>`<main><div class="node--type-admission-reqs-ma node--full"><div class="section--selections"><select id="prev-education" class="content-selector__options" ${controlExtra}><option value="prev-education-0">Select an option</option><option value="prev-education-1">Dutch degree</option><option value="prev-education-2">Non-Dutch degree</option></select></div><div class="section--admission-requirements"><div role="region" data-id="prev-education-2" aria-hidden="true" aria-label="Admission requirements ${label}" ${regionExtra}><h2>${label}</h2><p>Research-university degree and approximately 12 EC mathematics.</p></div></div><div class="section--application-period"><div role="region" data-id="prev-education-2" aria-hidden="true"><p>Unselected nationality deadline</p></div></div><div role="region" data-id="prev-education-2" aria-hidden="true" aria-label="Manual Non-Dutch degree">Unselected procedure</div></div></main>`;
test('Radboud entry conditions retain their degree label without borrowing calendar regions',()=>{
 const text=programmeText(admissions());
 assert.match(text,/Non-Dutch degree Research-university degree and approximately 12 EC mathematics/);
 assert.doesNotMatch(text,/Unselected nationality|Unselected procedure|Select an option/);
 for(const html of [admissions('disabled'),admissions('aria-hidden="true"'),admissions().replace('prev-education-2">Non-Dutch','prev-education-3">Non-Dutch'),admissions('','','Unknown degree'),admissions().replace('section--admission-requirements','section--other'),admissions().replace('<main>','<main><select id="prev-education"></select>')])assert.doesNotMatch(programmeText(html),/Research-university degree/);
});

const calendarPage=()=>admissions().replace('</select></div>','</select><select id="admissions-period" class="content-selector__options"><option value="admissions-period-2">EU/EEA country</option><option value="admissions-period-3">Non-EU/EEA country</option></select></div>').replace('<div class="section--application-period">','<div class="section">'+[['2','EU/EEA country','01 July 2027'],['3','Non-EU/EEA country','01 April 2027']].map(([id,label,date])=>`<div role="region" data-id="admissions-period-${id}" aria-hidden="true" aria-label="Application period ${label}">${['1','2'].map(degree=>`<div role="region" data-id="prev-education-${degree}" aria-hidden="true"><div class="section--deadlines"><h3>Application period</h3><p>Application deadline ${date}${id==='3'?' with scholarship 31 January 2027':''}</p></div></div>`).join('')}</div>`).join('')+'</div><div class="section--application-period">');
test('Radboud calendars retain both nationality and previous-degree conditions',()=>{
 const text=programmeText(calendarPage());
 assert.match(text,/Application period EU\/EEA country Dutch degree.*01 July 2027.*Non-Dutch degree.*01 July 2027/);
 assert.match(text,/Application period Non-EU\/EEA country Dutch degree.*01 April 2027.*Non-Dutch degree.*31 January 2027/);
 assert.doesNotMatch(text,/Unselected nationality|Unselected procedure/);
 const european=text.split('Application period EU/EEA country')[1].split('Application period Non-EU/EEA country')[0];assert.doesNotMatch(european,/January|April/);
 for(const html of [calendarPage().replace('id="admissions-period"','disabled id="admissions-period"'),calendarPage().replace('value="prev-education-2">Non-Dutch','value="prev-education-3">Non-Dutch'),calendarPage().replaceAll('aria-label="Application period Non-EU/EEA country"','aria-label="Other calendar"')])assert.doesNotMatch(programmeText(html),/31 January 2027/);
});

const course=(year,code='2602WETMAP',visibleCode=code,title='Master thesis Financial and Applied Mathematics')=>`<section class="course"><header><h5 class="heading"><a href="?id=${year}-${code}&amp;lang=en">${title}</a></h5></header><div class="main mainCourse"><section class="fiche"><div class="spec guideNr"><div class="value">${visibleCode}</div></div><div class="spec points"><div class="value">30 ECTS-credits</div></div></section></div></section>`;
const antwerp=(currentCourse=course(2026),oldActive='')=>`<main><div class="main tabMain"><section class="pane stateActive" id="M0032004-2026"><h3>2026-2027</h3><section class="programmes">${currentCourse}</section></section><section class="pane ${oldActive}" id="M0032004-2025"><h3>2025-2026</h3><section class="programmes">${course(2025,'2602WETMAP','2602WETMAP','Obsolete specialisation thesis')}</section></section></div></main>`;
test('Antwerp keeps code-matched academic headers only in the selected programme year',()=>{
 const text=programmeText(antwerp());
 assert.match(text,/2026-2027.*Master thesis Financial and Applied Mathematics.*2602WETMAP.*30 ECTS/);
 assert.doesNotMatch(text,/2025-2026|Obsolete specialisation/);
 for(const html of [antwerp(course(2025)),antwerp(course(2026,'2602WETMAP','DIFFERENT')),antwerp(course(2026).replace('class="spec points"','class="other"')),antwerp(course(2026),'stateActive'),'<nav>'+antwerp()+'</nav>'])assert.doesNotMatch(programmeText(html),/Master thesis Financial and Applied Mathematics/);
});

test('documented Dutch dissertation names and assessed French research placements qualify',()=>{
 for(const text of ['De masterproef is een wetenschappelijk werk','Masterproeven worden individueel verdedigd','During the M2, all students will do a long internship during the 2nd semester. Students will submit a preregistration document to their track directors. Students will submit a full report and present in front of an interdisciplinary jury.','Le stage de fin d’études (avril à septembre) représente 21 ECTS. Il constitue une initiation aux métiers de la recherche, il peut être effectué en laboratoire de recherche ou dans un service R&D d’entreprise.'])assert.equal(hasResearchComponent(text),true);
 for(const text of ['Bachelorproef','Masterproefbegeleiding','During the M2, all students will do a long internship. Students will submit a full report.','Students will submit a preregistration document and learn about research careers.','Le stage de fin d’études représente 21 ECTS. Il constitue une initiation aux métiers de l’entreprise.','Une initiation aux métiers de la recherche peut être suivie après un stage professionnel.'])assert.equal(hasResearchComponent(text),false);
});
test('French numerical mathematics is a discipline without inferring ML from numerical mechanics',()=>{
 assert.deepEqual(fieldsFrom('Mathématiques Numériques, Calcul Intensif et Données'),['Matemáticas aplicadas']);
 for(const text of ['Mathématiques, Mécanique, Physique','Mécanique numérique et matériaux','outils numériques pour enseigner les mathématiques'])assert.deepEqual(fieldsFrom(text),[]);
});
test('the named French numerical-modelling speciality is applied mathematics',()=>{
 assert.deepEqual(fieldsFrom("Modélisation, méthodes numériques pour l'étude du système climatique."),['Matemáticas aplicadas']);
 for(const text of ['Etude du système climatique','Méthodes numériques de communication','Modélisation du système climatique'])assert.deepEqual(fieldsFrom(text),[]);
});
test('time-series analysis is statistics without promoting generic finance',()=>{
 assert.deepEqual(fieldsFrom('Líneas de investigación: Time Series Analysis'),['Estadística']);
 for(const text of ['Banca y Finanzas','Financial time-series charts','Economic Policy and Public Policy Design and Evaluation'])assert.deepEqual(fieldsFrom(text),[]);
});
test('telematic network services establish CS without inferring it from radio engineering',()=>{
 assert.deepEqual(fieldsFrom('Líneas de investigación: Redes y Servicios Telemáticos'),['Informática']);
 for(const text of ['Tecnologías radio y telecomunicación','Fotónica','Tecnologías Inalámbricas'])assert.deepEqual(fieldsFrom(text),[]);
});
test('EHU research-line cells and lists retain independent boundaries within the labelled table',()=>{
 const html='<main><div class="upv-tabla"><table id="tableSearchProfesorado"><caption>Equipos y líneas de investigación</caption><thead><tr><th>Equipos de investigación</th><th>Líneas de investigación</th></tr></thead><tbody><tr><td>Finanzas</td><td><ul><li>Teoria de juegos</li><li>Time Series Analysis</li></ul></td></tr><tr><td><a>Redes y Servicios Telemáticos</a></td><td><ul><li>Redes y Servicios Telemáticos</li></ul></td></tr></tbody></table></div></main>';
 const text=programmeText(html);
 assert.match(text,/Teoria de juegos Time Series Analysis/);
 assert.match(text,/Redes y Servicios Telemáticos Redes y Servicios Telemáticos/);
 assert.deepEqual(fieldsFrom(text),['Estadística','Informática']);
 assert.deepEqual(fieldsFrom(programmeText('<nav>'+html+'</nav><main>Admisión</main>')),[]);
 assert.deepEqual(fieldsFrom(programmeText('<div hidden>'+html+'</div><main>Admisión</main>')),[]);
 assert.equal(programmeText('<main><table><tr><td>A</td><td>B</td></tr></table><ul><li>C</li><li>D</li></ul></main>'),'ABCD');
 for(const altered of [html.replace('class="upv-tabla"','class="other"'),html.replace('Equipos y líneas de investigación','Otras titulaciones'),html.replace('Equipos de investigación','Títulos de acceso'),html.replace('<main>','<main><table id="tableSearchProfesorado"></table>')])assert.doesNotMatch(programmeText(altered),/juegos Time Series/);
});
