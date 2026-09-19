import test from 'node:test';
import assert from 'node:assert/strict';
import {parseJobbnorgePdf,jobbnorgeFallback,jobbnorgeCandidate} from './jobbnorge.mjs';
const source={id:'jobbnorge',name:'Jobbnorge'},page={checkedAt:new Date().toISOString(),hash:'pdf',finalUrl:'https://www.jobbnorge.no/en/available-jobs/joblisting/pdf/42'},feed={...page,hash:'feed',finalUrl:'https://publicapi.jobbnorge.no/v3/jobs?language=2'};
const job={id:42,link:'https://www.jobbnorge.no/ledige-stillinger/stilling/42',title:'PhD Research Fellow',employer:'University of Oslo',locations:[{isDomestic:true,area:'Oslo'}],deadline:'04.10.2099',jobDuration:'Temporary'};
const text=`Jobbnorge ID: 42
Deadline: 10/4/2099
About the project
Develop probabilistic inference methods for machine learning.
Required selection criteria
You must have a relevant Master's degree in materials science or physics. Master students can apply, but the master's degree must be obtained before starting the position.
The degree course corresponds to five years of Norwegian university education.
Salary and conditions
Your gross salary will normally be NOK 550 800,- per annum.
The employment period is 3 years.
The position is conditional on external funding.`;
test('official PDF verifies generic titles, actual entry field, salary and employment duration',()=>{
 assert.equal(jobbnorgeCandidate(job),true);
 const r=parseJobbnorgePdf(text,job,source,page,feed);
 assert.equal(r.stage,'doctorado');assert.ok(r.fields.includes('Machine learning'));assert.equal(r.entry,'Máster');
 assert.equal(r.funding.amount,550800);assert.equal(r.funding.currency,'NOK');assert.equal(r.funding.period,'year');assert.equal(r.funding.gross,true);
 assert.equal(r.duration,'The employment period is 3 years.');assert.match(r.eligibilityNote,/materials science or physics/);assert.match(r.eligibilityNote,/terminado antes/);assert.match(r.eligibilityNote,/financiación externa/);
 assert.equal(r.evidence.method,'official-vacancy-pdf');assert.equal(r.evidence.feedHash,'feed');
 assert.deepEqual(r.languages,[]);
});
test('PDF identity or deadline conflict prevents a false fresh verification',()=>{
 assert.throws(()=>parseJobbnorgePdf(text.replace('ID: 42','ID: 99'),job,source,page,feed),/pdf_identity_mismatch/);
 assert.throws(()=>parseJobbnorgePdf(text.replace('10/4/2099','4/10/2099'),job,source,page,feed),/pdf_deadline_conflict/);
});
test('salary ranges remain ranges and permanent research posts belong to academic career',()=>{
 const body=text.replace("You must have a relevant Master's degree",'You must have a doctoral degree').replace('550 800,-','685 900 - 725 000,-').replace('The employment period is 3 years.','');
 const r=parseJobbnorgePdf(body,{...job,title:'Researcher in applied mathematics',jobDuration:'Permanent'},source,page,feed);
 assert.equal(r.stage,'faculty');assert.equal(r.entry,'Doctorado');assert.equal(r.funding.amount,null);assert.match(r.funding.text,/685 900 - 725 000/);
});
test('a PDF failure preserves the previous verified details and marks the review uncertain',()=>{
 const previous=parseJobbnorgePdf(text,job,source,page,feed),later={...feed,checkedAt:'2099-09-30T12:00:00Z'};
 const r=jobbnorgeFallback(job,source,later,previous,'http_404');
 assert.equal(r.entry,previous.entry);assert.equal(r.verifiedAt,previous.verifiedAt);assert.equal(r.evidence.contentHash,'pdf');assert.equal(r.seenAt,later.checkedAt);assert.equal(r.status,'unverified');assert.equal(r.lastError,'pdf_http_404');
 assert.equal(previous.lastError,undefined);
});
test('discipline mentions in qualifications and university background do not classify the research',()=>{
 const body=text.replace('Develop probabilistic inference methods for machine learning.','Study medieval manuscripts.').replace('materials science or physics','computer science').concat('\nGeneral information\nOur university hosts a machine learning centre.');
 assert.equal(parseJobbnorgePdf(body,job,source,page,feed),null);
});
test('a language deadline or early project plan is not the duration of employment',()=>{
 const body=text.replace('The employment period is 3 years.','The project plan will be prepared during the first three months of the employment period. New employees by appointment are required to learn Norwegian within three years.');
 assert.equal(parseJobbnorgePdf(body,job,source,page,feed).duration,null);
 assert.equal(parseJobbnorgePdf(body,{...job,jobDuration:'Permanent'},source,page,feed).duration,'Contrato permanente');
});
test('using statistics or comparing observations with numerical models is not methods research',()=>{
 for(const topic of ['Study counselling in special needs education and propose statistical methods appropriate to the survey questions.','Analyse solar observations and compare them with numerical models.']){
  assert.equal(parseJobbnorgePdf(text.replace('Develop probabilistic inference methods for machine learning.',topic),job,source,page,feed),null);
 }
});
test('Norwegian qualification headings stop incidental methods from leaking into the research topic',()=>{
 const body=text.replace('Develop probabilistic inference methods for machine learning.','Investigate physical activity and health.').replace('Required selection criteria','Nødvendige kvalifikasjoner').replace('Salary and conditions','Ønskede kvalifikasjoner\nExperience in causal inference.\nSalary and conditions');
 assert.equal(parseJobbnorgePdf(body,job,source,page,feed),null);
});
test('real duties and position descriptions survive empty project templates',()=>{
 const body=text.replace('About the project\nDevelop probabilistic inference methods for machine learning.','About the position\nDevelop machine learning methods.\nAbout the project\nDeleted if not applicable. Here you can enter brief information about the project.\nDuties of the position\nConduct research within the framework described above.');
 assert.ok(parseJobbnorgePdf(body,job,source,page,feed).fields.includes('Machine learning'));
 const duties=text.replace('Develop probabilistic inference methods for machine learning.','Study the authenticity of visual media.\nDuties of the position\nDevelop machine-learning methods for detecting synthetic images.');
 assert.ok(parseJobbnorgePdf(duties,job,source,page,feed).fields.includes('Machine learning'));
});
