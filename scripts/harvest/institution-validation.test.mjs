import test from 'node:test';
import assert from 'node:assert/strict';
import {validateInstitutionRegistry} from './institution-validation.mjs';
const registry=()=>({research:{subjects:[{id:'cs',countryScope:['DE']}]},institutions:[{id:'example',name:'Example',country:'AM',geography:'ehea-extension',sources:[],researchMetrics:{cs:{tier:'T2',volume:100,impactEligible:80,impactCoverage:.9}}}]});
test('publication accepts an EHEA extension tier only after the discipline explicitly includes its country',()=>{
 const data=registry();assert.throws(()=>validateInstitutionRegistry(data),/Invalid research tier/);
 data.research.subjects[0].countryScope.push('AM');assert.doesNotThrow(()=>validateInstitutionRegistry(data));
 data.institutions[0].geography='campus-review';assert.throws(()=>validateInstitutionRegistry(data),/Invalid research tier/);
});
test('publication still rejects missing discipline provenance, insufficient samples and non-finite metrics',()=>{
 const data=registry();data.institutions[0].geography='europe';data.institutions[0].country='DE';
 assert.doesNotThrow(()=>validateInstitutionRegistry(data));
 for(const [key,value] of [['volume',null],['impactEligible',49],['impactCoverage',.79],['impactCoverage',Infinity]]){
  const copy=structuredClone(data);copy.institutions[0].researchMetrics.cs[key]=value;assert.throws(()=>validateInstitutionRegistry(copy),/Invalid research tier/);
 }
 data.research.subjects=[];assert.throws(()=>validateInstitutionRegistry(data),/Invalid research tier/);
});
