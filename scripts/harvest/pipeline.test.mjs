import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {parseJobbnorge,parseJobbnorgeFeed} from './jobbnorge.mjs';
import {observations,persistObservations} from './http.mjs';
import {programmeText,hasResearchComponent} from './programme-evidence.mjs';
test('Jobbnorge feed retains its evidence limit and rejects foreign workplaces',()=>{
 const job={id:42,link:'https://www.jobbnorge.no/ledige-stillinger/stilling/42',title:'PhD Research Fellow in Statistics',employer:'University of Oslo',locations:[{isDomestic:true,area:'Oslo'}],deadline:'04.10.2099'};
 const source={id:'jobbnorge',name:'Jobbnorge'},page={checkedAt:new Date().toISOString(),hash:'h',finalUrl:'https://publicapi.jobbnorge.no/v3/jobs?language=2'};
 const r=parseJobbnorge(job,source,page);assert.equal(r.stage,'doctorado');assert.equal(r.entry,'Consultar requisitos');assert.equal(r.funding.amount,undefined);assert.equal(r.evidence.method,'official-vacancy-feed');assert.equal(r.deadline,'2099-10-04');
 assert.equal(parseJobbnorge({...job,locations:[{isDomestic:false}]},source,page),null);
 assert.throws(()=>parseJobbnorgeFeed('{"error":"unavailable"}'),/listing_structure_changed/);
});
test('master degree projects count as research evidence, navigation and scripts do not',()=>{
 assert.equal(hasResearchComponent(programmeText('<main>The final term is dedicated to the master’s degree project.</main>')),true);
 assert.equal(hasResearchComponent(programmeText('<nav>Thesis</nav><main>General admissions</main><script>const word="research project"</script>')),false);
});
test('successive source runs retain observations with their original run ids',async()=>{
 const before=process.cwd(),tmp=await fs.mkdtemp(path.join(os.tmpdir(),'trama-observations-'));const length=observations.length;
 try{process.chdir(tmp);await fs.mkdir('.cache');await fs.writeFile('.cache/observations.json',JSON.stringify({runId:'older',observations:[{url:'https://example.org/old',checkedAt:'2026-09-18',hash:'a'}]}));
 observations.push({url:'https://example.org/new',checkedAt:'2026-09-19',hash:'b'});await persistObservations({runId:'newer'});
 const result=JSON.parse(await fs.readFile('.cache/observations.json'));assert.equal(result.observations.length,2);assert.equal(result.observations[0].runId,'older');assert.equal(result.observations[1].runId,'newer');
 }finally{process.chdir(before);observations.length=length;await fs.rm(tmp,{recursive:true,force:true});}
});
