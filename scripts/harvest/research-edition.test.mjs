import test from 'node:test';
import assert from 'node:assert/strict';
import {retainCompletedSubjects} from './research-edition.mjs';
const definitions=[{id:'cs',filter:'field:17'},{id:'ml',filter:'subfield:1702'}];
const subject=id=>({...definitions.find(d=>d.id===id),countryScope:['DE'],metrics:Object.fromEntries(['volume','impactTotal','impactEligible','top10'].map(metric=>[metric,{complete:true,references:[{checkedAt:'2026-09-19',url:'https://api.openalex.org/works'}],groups:[]}]))});
const edition=subjects=>({workTypes:['article','conference-paper','data-paper','software-paper'],subjects});
test('resuming another discipline retains complete subjects with their own scope and observation dates',()=>{
 const cs=subject('cs'),ml=subject('ml');ml.metrics.top10.complete=false;
 assert.deepEqual(retainCompletedSubjects(edition([cs,ml]),definitions),[cs]);
});
test('missing aggregates or changed subject and publication-type definitions cannot survive as a complete edition',()=>{
 const cs=subject('cs');delete cs.metrics.top10;
 assert.deepEqual(retainCompletedSubjects(edition([cs]),definitions),[]);
 const changed=subject('cs');changed.filter='field:99';assert.deepEqual(retainCompletedSubjects(edition([changed]),definitions),[]);
 assert.deepEqual(retainCompletedSubjects({workTypes:['conference-paper'],subjects:[subject('cs')]},definitions),[]);
});
