import test from 'node:test';
import assert from 'node:assert/strict';
import {buildUniverse} from './institution-universe.mjs';
import {computeTiers,wilsonLower} from './research-tiers.mjs';
import {fieldsFrom} from './domain.mjs';
import {hasResearchComponent,programmeText} from './programme-evidence.mjs';
import {discoverLinks,addDiscoveryJob,selectDiscoveryJobs} from './institution-discovery.mjs';
const release={doi:'10.1/example',metadata:{publication_date:'2026-01-01'},files:[{key:'sample.zip',checksum:'md5:test'}]};
const record=(id,country)=>({id:'https://ror.org/'+id,status:'active',types:['education'],names:[{value:id,types:['ror_display']}],locations:[{geonames_details:{country_code:country,name:'City',lat:1,lng:1}}],links:[],domains:[]});
test('transcontinental registry location is never sufficient evidence of a European campus',()=>{
 const result=buildUniverse([record('europe','DE'),record('review','RU'),record('outside','US'),{...record('inactive','FR'),status:'inactive'}],release);
 assert.equal(result.institutions.length,2);assert.equal(result.institutions.find(x=>x.country==='RU').geography,'campus-review');assert.ok(result.institutions.every(x=>x.sources.length===0&&x.reviewStatus==='candidate'));
});
test('small or missing bibliometric samples are not assigned a low tier; equal results get equal tiers',()=>{
 const institutions=Array.from({length:25},(_,n)=>({id:String(n),ror:String(n),geography:'europe'}));
 const directory=Object.fromEntries(institutions.map(x=>[x.ror,{id:x.id}]));
 const groups=(count)=>institutions.map(x=>({key:x.id,count:x.id==='0'?0:count}));
 const subject={metrics:{volume:{complete:true,groups:groups(100)},impactTotal:{complete:true,groups:groups(100)},impactEligible:{complete:true,groups:groups(100)},top10:{complete:true,groups:groups(20)}}};
 const rows=computeTiers(institutions,subject,directory);assert.equal(rows[0].tier,null);assert.equal(rows[0].reason,'small-sample');assert.equal(new Set(rows.slice(1).map(x=>x.tier)).size,1);
 delete directory['1'];assert.equal(computeTiers(institutions,subject,directory)[1].reason,'identity-unmatched');
 subject.metrics.top10.complete=false;assert.throws(()=>computeTiers(institutions,subject,directory),/incomplete_metric/);
});
test('citation uncertainty and coverage protect against flattering tiny or incomplete samples',()=>{
 assert.ok(wilsonLower(20,100)>wilsonLower(2,10));
 const institutions=[{id:'a',ror:'a',geography:'europe'}],directory={a:{id:'A'}};
 const metric=n=>({complete:true,groups:[{key:'A',count:n}]});
 const subject={metrics:{volume:metric(200),impactTotal:metric(100),impactEligible:metric(60),top10:metric(15)}};
 assert.equal(computeTiers(institutions,subject,directory)[0].reason,'citation-coverage');subject.metrics.top10=metric(61);assert.throws(()=>computeTiers(institutions,subject,directory),/inconsistent_citation/);
});
test('Spanish and Portuguese programme evidence is recognised without claiming research from the degree alone',()=>{
 assert.deepEqual(fieldsFrom('Máster en Ciencia de Datos'),['Ciencia de datos']);
 assert.ok(fieldsFrom('Mestrado em Inteligência Artificial').includes('Machine learning'));
 assert.ok(hasResearchComponent('Dissertação de natureza científica'));
 assert.equal(hasResearchComponent('Mestrado em Ciência de Dados'),false);
 assert.equal(hasResearchComponent('Hypothesis testing and speech synthesis are taught in this course.'),false);
 assert.ok(hasResearchComponent('Examples of master theses'));
 assert.ok(hasResearchComponent("Travail de fin d'études 36"));assert.ok(hasResearchComponent('Treball final de màster 20'));
 assert.ok(hasResearchComponent('Stage en entreprise ou laboratoire de recherche 16 ECTS'));assert.ok(hasResearchComponent('Master’s Degree Final Project 30 ECTS'));
 assert.ok(hasResearchComponent('stage au deuxième semestre de M2 et pourra être réalisé dans un laboratoire de recherche'));
 assert.equal(hasResearchComponent('stage en entreprise. Le laboratoire de recherche recrute séparément.'),false);
 assert.equal(hasResearchComponent('Un projet professionnel. '+ 'Les activités de la formation. '.repeat(20)+'Possibilités de recherches après le diplôme.'),false);
});
test('discovery records observed official links without turning external or PDF leads into verified programmes',()=>{
 const institution={id:'x',officialUrl:'https://example.edu',sources:[]};
 const result=discoverLinks('<a href="/msc-data-science?utm_source=x">MSc Data Science</a><a href="https://unrelated.test/masters">Masters data science</a><a href="/curriculum.pdf">Master curriculum</a><a href="/privacy">Privacy</a><a href="http://127.0.0.1/masters">Masters</a>',institution.officialUrl,institution);
 assert.equal(result.links.length,3);assert.equal(result.links.find(x=>x.url.includes('unrelated')).official,false);assert.equal(result.links.find(x=>x.pdf).type,'masters');assert.ok(result.links.some(x=>x.url==='https://example.edu/msc-data-science'));
 const queue=new Map();addDiscoveryJob(queue,institution,'https://example.edu/msc-data-science');addDiscoveryJob(queue,institution,'https://example.edu/msc-data-science?utm_source=test');assert.equal(queue.size,1);assert.equal([...queue.values()][0].status,'pending');
});
test('country rotation, retry dates and institution limits bound discovery without losing the queue',()=>{
 const rows=Array.from({length:10},(_,i)=>({id:String(i),country:i<8?'DE':'MT',institutionId:i<8?'DE-1':'MT-1',status:'pending',attempts:0,priority:1,depth:0}));
 const chosen=selectDiscoveryJobs(rows,{limit:4,perInstitution:2});assert.equal(chosen.length,4);assert.deepEqual(chosen.map(x=>x.country),['DE','MT','DE','MT']);assert.equal(rows.length,10);
 rows[8].status='external-review';rows[9].nextCheckAt='2099-01-01';assert.equal(selectDiscoveryJobs(rows,{limit:4,perInstitution:2}).length,2);
});
test('real disclosure panels remain academic evidence while hidden templates and navigation do not',()=>{
 const html='<main><button aria-controls="plan" aria-expanded="false">Plan</button><div id="plan" hidden aria-hidden="true">Thesis 30 ECTS</div><div><button aria-expanded="false">Study</button><div class="gd-accordion-content" hidden>Research project</div></div><div hidden>Obsolete stipend</div></main><nav><button aria-controls="nav-thesis">Menu</button><div hidden id="nav-thesis">Unrelated thesis</div></nav>';
 const text=programmeText(html);assert.match(text,/Thesis 30 ECTS/);assert.match(text,/Research project/);assert.doesNotMatch(text,/Obsolete|Unrelated/);
});
