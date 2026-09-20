import test from 'node:test';
import assert from 'node:assert/strict';
import {effectiveStatus,fieldsFrom,canonicalUrl,stageFrom} from './domain.mjs';
import {parseEuraxess,parseEuraxessList} from './adapters.mjs';
const now=Date.parse('2026-09-19T12:00:00Z');
test('unknown deadlines are not open and stale checks cannot imply open',()=>{assert.equal(effectiveStatus({kind:'position',verifiedAt:'2026-09-19',status:'unverified'},now),'unverified');assert.equal(effectiveStatus({kind:'position',verifiedAt:'2026-08-01',deadline:'2026-11-01',status:'open'},now),'unverified');assert.equal(effectiveStatus({kind:'position',verifiedAt:'2026-09-19',deadline:'2026-09-18',status:'open'},now),'closed');});
test('programme existence does not imply a currently open application round',()=>assert.equal(effectiveStatus({kind:'programme',verifiedAt:'2026-09-19'},now),'programme'));
test('preserve vacancy identity in query params while removing tracking',()=>assert.equal(canonicalUrl('https://example.org/apply?rmjob=42&utm_source=test&site=7'),'https://example.org/apply?rmjob=42&site=7'));
test('stage selection distinguishes postdoc from doctorate',()=>{assert.equal(stageFrom('Post-Doctoral Research Visit'),'postdoc');assert.equal(stageFrom('PhD in optimization'),'doctorado');assert.equal(stageFrom('HR coordinator'),null);assert.deepEqual(fieldsFrom('Professor of medieval history'),[]);});
test('the official computer and information science subject is recognised without generic science',()=>{
 assert.deepEqual(fieldsFrom('PhD research in computer and information science'),['Informática']);
 assert.deepEqual(fieldsFrom('Computer and Information Sciences'),['Informática']);
 assert.deepEqual(fieldsFrom('PhD in information science and science communication'),[]);
});
test('French doctoral modelling evidence retains its applied and stochastic scope',()=>{
 assert.deepEqual(fieldsFrom('Probabilités appliquées; modèles stochastiques et applications en écologie et en biologie des systèmes; modèles mathématiques de la croissance des plantes'),['Estadística','Matemáticas aplicadas']);
 assert.deepEqual(fieldsFrom('Doctorat en mathématiques: topologie et géométrie différentielle'),[]);
});
test('Czech named applied and learning subjects retain their scope without generic mathematics',()=>{
 assert.deepEqual(fieldsFrom('Výpočetní a aplikovaná matematika'),['Matemáticas aplicadas']);
 assert.deepEqual(fieldsFrom('Matematická analýza a numerická matematika'),['Matemáticas aplicadas']);
 assert.deepEqual(fieldsFrom('hluboké znalosti aplikované matematiky'),['Matemáticas aplicadas']);
 assert.deepEqual(fieldsFrom('moderní matematickou fyziku a aplikovanou matematiku'),['Matemáticas aplicadas']);
 assert.deepEqual(fieldsFrom('strojové učení a umělou inteligenci'),['Machine learning']);
 assert.deepEqual(fieldsFrom('aplikaci nejnovějších poznatků umělé inteligence na rozvíjejících se aplikacích systémů inteligentního rozhodování a komunikace'),['Machine learning']);
 assert.deepEqual(fieldsFrom('Matematická analýza, geometrie a algebra'),[]);
});
test('Russian postgraduate speciality names are recognised without generic engineering',()=>{
 assert.deepEqual(fieldsFrom('7-06-0611-03 Искусственный интеллект'),['Machine learning']);
 assert.deepEqual(fieldsFrom('05.13.15 – Вычислительные машины, комплексы и компьютерные сети'),['Informática']);
 assert.deepEqual(fieldsFrom('Машиноведение, системы приводов и детали машин'),[]);
});
test('Hungarian applied mathematics is recognised without promoting generic mathematics',()=>{
 assert.deepEqual(fieldsFrom('Az alkalmazott matematika a műszaki- és természet-tudományokban alkalmazott matematikai módszerekre koncentrál'),['Matemáticas aplicadas']);
 assert.deepEqual(fieldsFrom('Matematika, algebra és geometria'),[]);
});
test('Finnish cybersecurity degree names retain their scope without policy compounds',()=>{
 for(const text of ['kyberturvallisuus','Kyberturvallisuuden maisteriohjelma'])assert.deepEqual(fieldsFrom(text),['Informática']);
 for(const text of ['turvallisuus','kyberturvallisuuspolitiikka','Matematiikan maisteriohjelma'])assert.deepEqual(fieldsFrom(text),[]);
});
test('BayNAT computational mathematics is applied while pure branches remain unclassified',()=>{
 assert.deepEqual(fieldsFrom('Computational Mathematics in Science and Engineering (BayCompMath)'),['Informática','Matemáticas aplicadas']);
 assert.deepEqual(fieldsFrom('Analysis, Algebra and Geometry'),[]);
});
test('hidden expiry templates do not close a future EURAXESS offer',()=>{const html='<h1>Job offerPhD in machine learning</h1><dl><dt>Organisation/Company</dt><dd>Test University</dd><dt>Country</dt><dd>Sweden</dd><dt>Research Field</dt><dd>Computer science</dd><dt>Application Deadline</dt><dd><time datetime="2099-10-05T12:00:00Z">date</time></dd></dl><main><div style="display:none">STATUS: EXPIRED</div></main>';const r=parseEuraxess(html,'https://example.org/1',{id:'test',name:'test'},{checkedAt:new Date().toISOString(),hash:'test',finalUrl:'https://example.org/1'});assert.equal(r.status,'open');const closed=parseEuraxess(html.replace('style="display:none"',''),'https://example.org/1',{id:'test',name:'test'},{checkedAt:new Date().toISOString(),hash:'test',finalUrl:'https://example.org/1'});assert.equal(closed.status,'closed');});
test('offers whose destination is outside Europe are excluded',()=>{const r=parseEuraxess('<h1>PhD in machine learning</h1><dl><dt>Country</dt><dd>United States</dd></dl>','https://example.org/1',{id:'test'},{});assert.equal(r,null);});

test('salary separators retain the amount and original period',async()=>{const {salaryFromText}=await import('./domain.mjs');for(const s of ['€2,300 gross per month','2.300 € bruts mensuels','2 300 EUR monthly'])assert.equal(salaryFromText(s).amount,2300);assert.equal(salaryFromText('EUR 2.300,50 gross monthly').amount,2300.5);assert.equal(salaryFromText('salary according to experience').amount,null);});
test('failed rechecks lose active status without replacing last verified facts',()=>{assert.equal(effectiveStatus({kind:'position',status:'open',verifiedAt:'2026-09-19',deadline:'2026-12-01',lastError:'http_403'},now),'unverified');assert.equal(effectiveStatus({kind:'programme',lastError:'http_403'},now),'unverified');});
test('doctoral research engineers belong after the doctorate',()=>{assert.equal(stageFrom('Research engineer in machine learning','','PhD or equivalent'),'postdoc');assert.equal(stageFrom('Research engineer in machine learning','','5-year university degree'),'grado');});
test('listed vacancies with no deadline stay distinct from open deadlines',()=>assert.equal(effectiveStatus({kind:'position',status:'listed',verifiedAt:'2026-09-19'},now),'listed'));
test('international is not an internship',()=>assert.equal(stageFrom('Junior Researcher in Public Economics and International Taxation'),null));
test('a PhD project mention does not become a doctoral entry requirement',async()=>{const {requiredDegree,durationFrom}=await import('./domain.mjs');assert.equal(requiredDegree('Candidates will join our PhD project in computing.'),'Consultar requisitos');assert.equal(requiredDegree('Requirements A master’s degree in Statistics.'),'Máster');assert.equal(durationFrom('Fixed-term contract: 4 years.'),'4 years');});
