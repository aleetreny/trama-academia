import test from 'node:test';
import assert from 'node:assert/strict';
import {collectIdentities,reusableIdentities} from './openalex-identities.mjs';
const ror=n=>'https://ror.org/'+String(n).padStart(9,'0');
const row=n=>({id:'https://openalex.org/I'+n,ror:ror(n)});
const now=Date.parse('2026-09-20T10:00:00Z');
function reference(rors,checkedAt='2026-09-19T10:00:00Z'){
 const url=new URL('https://api.openalex.org/institutions');url.search=new URLSearchParams({filter:'ror:'+rors.join('|'),per_page:100,select:'id,ror,display_name,country_code,type,geo'}).toString();return {url:url.href,checkedAt};
}
test('expanding the universe reuses positive and negative identity matches with original provenance',async()=>{
 const old=reference([ror(1),ror(2)]),snapshot={directory:{[ror(1)]:row(1)},references:[old]},calls=[];
 const result=await collectIdentities([ror(3),ror(2),ror(1)],{snapshot,now,fetchPage:async(path,params)=>{
  calls.push(params.filter);return {...reference([ror(3)],'2026-09-20T10:00:00Z'),body:{meta:{count:1},results:[row(3)]}};
 }});
 assert.deepEqual(calls,['ror:'+ror(3)]);assert.deepEqual(Object.keys(result.directory),[ror(1),ror(3)]);assert.deepEqual(result.references[0],old);
});
test('stale, future and unrelated references never turn missing data into confirmed negative matches',()=>{
 const refs=[reference([ror(1)],'2026-09-10T10:00:00Z'),reference([ror(2)],'2026-09-21T10:00:00Z'),{...reference([ror(3)]),url:'https://example.org/institutions?filter=ror:'+ror(3)}];
 assert.deepEqual(reusableIdentities({directory:{},references:refs},[ror(1),ror(2),ror(3)],now).pending,[ror(1),ror(2),ror(3)]);
});
test('incomplete or conflicting identity responses fail before a snapshot can be saved',async()=>{
 const response={...reference([ror(1)]),body:{meta:{count:2},results:[row(1)]}};
 await assert.rejects(collectIdentities([ror(1)],{now,fetchPage:async()=>response}),/incomplete_ror_batch/);
 response.body.results.push({...row(1),id:'https://openalex.org/I99'});
 await assert.rejects(collectIdentities([ror(1)],{now,fetchPage:async()=>response}),/ambiguous_ror/);
});
