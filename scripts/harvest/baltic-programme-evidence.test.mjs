import test from 'node:test';
import assert from 'node:assert/strict';
import {programmeText,hasResearchComponent} from './programme-evidence.mjs';
import {fieldsFrom} from './domain.mjs';

test('Estonian thesis-writing semester does not include the actual exam-instead-of-thesis route',()=>{
 const positive='Viimane semester on mõeldud magistritöö kirjutamiseks.';
 assert.equal(hasResearchComponent(positive),true);
 assert.equal(hasResearchComponent(positive.normalize('NFD')),true);
 for(const text of ['magistritöö','bakalaureusetöö','akadeemilise magistritöö asemel magistrieksamiga lõpetamine','Viimane semester ei ole mõeldud magistritöö kirjutamiseks.'])assert.equal(hasResearchComponent(text),false);
 assert.equal(hasResearchComponent(programmeText('<nav>'+positive+'</nav><main>magistritöö asemel magistrieksam</main>')),false);
});
test('Lithuanian master dissertation is distinct from a bachelor capstone or an incomplete word',()=>{
 for(const text of ['Magistro baigiamasis darbas [BENMINF01] Tomas Krilavičius 30','Ketvirtame semestre rengiamas ir ginamas magistro baigiamasis darbas.'])assert.equal(hasResearchComponent(text),true);
 for(const text of ['Bakalauro baigiamasis darbas','Baigiamasis darbas','Magistro baigiamasis darbastalis'])assert.equal(hasResearchComponent(text),false);
 assert.equal(hasResearchComponent(programmeText('<div hidden>Magistro baigiamasis darbas</div><main>Bakalauro baigiamasis darbas</main>')),false);
});
test('Lithuanian applied mathematics and ML names retain discipline and word boundaries',()=>{
 assert.deepEqual(fieldsFrom('Taikomoji matematika'),['Matemáticas aplicadas']);
 assert.deepEqual(fieldsFrom('Mašininis mokymas [INF5002]'),['Machine learning']);
 assert.deepEqual(fieldsFrom('Mašininis mokymas'.normalize('NFD')),['Machine learning']);
 for(const text of ['Matematika','Mokymas','Netaikomoji matematika','Mašininis mokymasabc'])assert.deepEqual(fieldsFrom(text),[]);
});
test('VU cartography graduation and computing curriculum are explicit, not inferred from GIS',()=>{
 assert.equal(hasResearchComponent('Studijas užbaigsi magistro baigiamuoju darbu.'),true);
 for(const text of ['Studijas užbaigsi bakalauro baigiamuoju darbu.','Studijas neužbaigsi magistro baigiamuoju darbu.','magistro baigiamuoju darbu'])assert.equal(hasResearchComponent(text),false);
 assert.deepEqual(fieldsFrom('duomenų bazių projektavimo, erdvinių duomenų programavimo'),['Informática']);
 for(const text of ['GIS metodologijos','Kartografija','erdvinių duomenų','duomenų bazių projektavimo'])assert.deepEqual(fieldsFrom(text),[]);
});
