import test from 'node:test';
import assert from 'node:assert/strict';
import {nordicDate,parseKth,parseAalto,parseUppsalaList,researchFields} from './nordic-adapters.mjs';
import {stageFrom,fieldsFrom} from './domain.mjs';
import {requiredDegree} from './domain.mjs';
const source={id:'test',name:'Test university'},url='https://example.org/job/1';
const page={checkedAt:new Date().toISOString(),hash:'test',finalUrl:url};
test('Nordic deadlines reject invalid dates and retain day precision',()=>{
 for(const d of ['24.Sep.2026','24.9.2026','24 September 2026','2026-09-24T12:00:00Z'])assert.equal(nordicDate(d),'2026-09-24');
 for(const d of ['31.2.2026','01.13.2026','According to agreement'])assert.equal(nordicDate(d),null);
});
test('Nordic titles include local academic titles and generic researchers with an explicit degree',()=>{
 assert.equal(stageFrom('Stipendiat i statistikk'),'doctorado');
 assert.equal(stageFrom('PhD Research Fellow in Statistics'),'doctorado');
 assert.equal(stageFrom('Postdoctoral Research Fellow'),'postdoc');
 assert.equal(stageFrom('Researcher in numerical methods','','A doctoral degree is required'),'postdoc');
 assert.equal(stageFrom('Doctoral researcher','','doctoral degree project'),'doctorado');
 assert.equal(stageFrom('Research coordinator','','A bachelor degree'),null);
 assert.ok(fieldsFrom('informatikk og maskinlæring').includes('Machine learning'));
});
test('KTH location is the job location and project PhD mentions do not become entry requirements',()=>{
 const html='<h1>Doctoral student in machine learning</h1><div class="details-main-col"><h3>Project description</h3><p>A doctoral research project.</p><h3>Admission requirements</h3><p>A master’s degree or equivalent knowledge is required.</p></div><div class="details-list"><b>Country</b><p>Sweden</p></div><div class="details-list"><b>Last application date</b><p>24.Sep.2099</p></div>';
 const r=parseKth(html,url,source,page);assert.equal(r.entry,'Máster o formación equivalente');assert.equal(r.deadline,'2099-09-24');assert.equal(r.duration,null);
 assert.equal(parseKth(html.replace('<p>Sweden</p>','<p>United States</p>'),url,source,page),null);
});
test('Aalto does not infer workplace from the university footer or promote a conflicting hour',()=>{
 const html='<main><h1>Postdoctoral researcher in computer science</h1><div class="aalto-user-generated-content"><p>Research in algorithms.</p><p>Requirements</p><p>You hold a PhD in computing.</p></div><div class="aalto-article__info-item"><h2>Application closes on</h2><time datetime="2099-10-04T12:00:00Z">4.10.2099</time></div><a href="https://aalto.wd3.myworkdayjobs.com/aalto/job/Espoo-Finland/Researcher_123/apply">Apply</a></main><footer>Aalto University, Finland</footer>';
 const r=parseAalto(html,url,source,page);assert.equal(r.deadline,'2099-10-04');assert.equal(r.deadlinePrecision,'day');assert.equal(r.entry,'Doctorado');
 assert.equal(parseAalto(html.replace('Espoo-Finland','Singapore'),url,source,page),null);
});
test('Uppsala parses the advertised total independently of the first ten visible hits',()=>{
 const result=parseUppsalaList('<script>AppRegistry.registerInitialState("app",'+JSON.stringify({categoryId:'jobVacancies',result:{hits:[{uri:'/job?query=17'}],count:82}})+');</script>');
 assert.equal(result.count,82);assert.equal(result.hits.length,1);
 assert.throws(()=>parseUppsalaList('<h1>Unavailable</h1>'),/listing_structure_changed/);
});
test('incidental software use does not become a computing research discipline',()=>{
 assert.deepEqual(researchFields('Lecturer in manufacturing','Teaching CAD and CAM software and using a database.'),[]);
 assert.deepEqual(researchFields('Chemistry researcher','Chemical extraction and statistical metabolomics analysis.'),[]);
 assert.ok(researchFields('Research assistant','Develop statistical models and inference for research articles.').includes('Estadística'));
 assert.ok(researchFields('Doctoral researcher','Develop machine-learning algorithms for dynamical systems.').includes('Machine learning'));
 assert.ok(researchFields('PhD student','Formal verification of quantum programs.').includes('Informática'));
});
test('teaching a masters programme is not a masters entry requirement',()=>{
 assert.equal(requiredDegree('The appointee must have good English skills as teaching is in a master’s programme.'),'Consultar requisitos');
 assert.equal(requiredDegree('Applicants must have completed their master’s degree.'),'Máster');
 assert.equal(requiredDegree('The appointee shall have a doctoral degree.'),'Doctorado');
});
