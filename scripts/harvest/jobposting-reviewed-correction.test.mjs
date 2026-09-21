import test from 'node:test';
import assert from 'node:assert/strict';
import {parseJobPosting} from './adapters.mjs';
import {idFor} from './domain.mjs';
const url='https://www.jobs.ac.uk/job/EXAMPLE/phd-studentship';
const title='PhD Studentship in Computer Science';
const page={checkedAt:'2026-09-21T12:00:00Z',hash:'original-page',finalUrl:url};
const source={id:'jobsacuk',name:'jobs.ac.uk'};
const description='Computer science research. A university teaching contract with salary of £31,236. Six years part-time. No visa sponsorship.';
const correction={id:idFor(url),url,title,reviewedAt:'2026-09-21',requiredText:['university teaching contract','No visa sponsorship.'],patch:{hours:'Doctorado a tiempo parcial',duration:'6 años',funding:{kind:'salary',amount:31236,currency:'GBP',period:'year',text:'Contrato docente doctoral'},eligibilityNote:'Sin patrocinio de visado'}};
function html(body=description){const posting={'@type':'JobPosting',title,description:body,jobLocation:{address:{addressCountry:'GB'}},employmentType:'Full Time',baseSalary:{currency:'GBP',value:{value:31236,unitText:'YEAR'}},validThrough:'2026-10-04',hiringOrganization:{name:'Example University'}};return `<main><h1>${title}</h1><p>${body}</p></main><script type="application/ld+json">${JSON.stringify(posting)}</script>`;}

test('reviewed teaching employment overrides generic studentship metadata on every parse',()=>{
 const record=parseJobPosting(html(),url,source,page,[correction]);
 assert.equal(record.funding.kind,'salary');assert.equal(record.funding.amount,31236);
 assert.equal(record.hours,'Doctorado a tiempo parcial');assert.equal(record.duration,'6 años');
 assert.equal(record.eligibilityNote,'Sin patrocinio de visado');assert.equal(record.evidence.contentHash,'original-page');
 assert.match(record.evidence.checks[0],/Reviewed source correction/);
});
test('changed eligibility stops a reviewed refresh instead of reintroducing unreviewed funding',()=>{
 assert.throws(()=>parseJobPosting(html(description.replace('No visa sponsorship.','Visa sponsorship offered.')),url,source,page,[correction]),/reviewed_correction_evidence_changed/);
 assert.equal(parseJobPosting(html(),url,source,page,[]).funding.kind,'scholarship','unrelated unreviewed studentships keep their previous parsing rule');
});
