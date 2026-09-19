import test from 'node:test';
import assert from 'node:assert/strict';
import {nuxtProgrammeText} from './nuxt-programme.mjs';
const url='https://example.edu/programmes/computing';
const page=(route='/programmes/computing',id='3',description='Computing research and a thesis.')=>'<script>window.__NUXT__=(function(a){return {routePath:'+JSON.stringify(route)+',data:[{programmes:[{id:'+JSON.stringify(id)+',Name:"MSc Computing",Description:'+JSON.stringify(description)+'}]}],state:{menu:"Unrelated scholarship 9000 EUR"}}})({});</script>';
test('Nuxt evidence is limited to the declared route, programme and literal description',()=>{
 assert.equal(nuxtProgrammeText(page(),url,'3'),'MSc Computing Computing research and a thesis.');
 assert.throws(()=>nuxtProgrammeText(page(),url,'4'),/missing_or_ambiguous/);
 assert.throws(()=>nuxtProgrammeText(page('/other'),url,'3'),/missing_or_ambiguous/);
 assert.throws(()=>nuxtProgrammeText(page(),url),/identity_required/);
 assert.throws(()=>nuxtProgrammeText(page()+page(),url,'3'),/missing_or_ambiguous/);
});
test('Nuxt computed content and executable statements are never evaluated as academic evidence',()=>{
 const dynamic=page().replace('"Computing research and a thesis."','retrieveRemoteContent()');
 assert.throws(()=>nuxtProgrammeText(dynamic,url,'3'),/missing_or_ambiguous/);
 const interrupted=page().replace('function(a){return','function(a){throw new Error("unreachable");return');
 assert.throws(()=>nuxtProgrammeText(interrupted,url,'3'),/missing_or_ambiguous/);
 assert.throws(()=>nuxtProgrammeText(page().replace('})({})','})(computeArguments())'),url,'3'),/missing_or_ambiguous/);
 assert.throws(()=>nuxtProgrammeText(page().replace('Name:"MSc Computing"','...unknown,Name:"MSc Computing"'),url,'3'),/missing_or_ambiguous/);
});
