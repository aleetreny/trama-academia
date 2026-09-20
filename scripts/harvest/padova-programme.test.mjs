import test from 'node:test';
import assert from 'node:assert/strict';
import {programmeText,hasResearchComponent} from './programme-evidence.mjs';

const thesis='<p>È prevista una tesi di laurea magistrale con relatore e attività di ricerca.</p>';
function fixture(options={}){
 const paragraph={type:'paragraph--editorial',id:'own-panel',status:true,field_publish:true,langcode:'it',field_roles:[],field_paragraph_publish_on:null,field_paragraph_unpublish_on:null,field_content:{processed:'$c'},...options.paragraph};
 const node={type:'node--didattica',title:'COMPUTER ENGINEERING',status:true,langcode:'it',path:{alias:'/corsi-di-laurea/computer-engineering'},field_caratteristiche_e_ambiti:[paragraph],...options.node};
 const component=['$','$L1',null,{node:'$a:props:node',renderedFields:{field_caratteristiche_e_ambiti:'$Ld'}}];
 const sections=[['$','section','own-panel',{id:'own-panel',className:'editorial',children:['$','$L2',null,{node:'$a:props:node',data:options.dataRef||'$a:props:node:field_caratteristiche_e_ambiti:0'}]}]];
 const body=options.body||thesis;
 let stream=':HL["/style.css","style"]\n'
  +'a:'+JSON.stringify(['$','$L0',null,{node}])+'\n'
  +'b:'+JSON.stringify(component)+'\n'
  +'c:T'+(options.byteLength??Buffer.byteLength(body)).toString(16)+','+body
  +'d:'+JSON.stringify(sections)+'\n'
  +'e:'+JSON.stringify({unrelated:'<p>Master thesis in an unrelated programme</p>'})+'\n';
 if(options.duplicate)stream+='f:'+JSON.stringify(component)+'\n';
 if(options.stream)stream=options.stream(stream);
 const chunks=[stream.slice(0,123),stream.slice(123)];
 const scripts=chunks.map(x=>'<script>self.__next_f.push('+JSON.stringify([1,x])+')</script>').join('');
 return '<html><head><meta property="og:url" content="https://www.unipd.it"></head><body><main><h1>'+(options.heading||'COMPUTER ENGINEERING')+'</h1><div role="tablist" aria-label="Sidebar tabs" '+(options.hidden?'hidden':'')+'><button role="tab">Caratteristiche e ambiti</button></div><p>Overview</p></main>'+scripts+'</body></html>';
}

test('Padova exposes only the published course panel and respects UTF-8 record lengths',()=>{
 const text=programmeText(fixture());
 assert.equal(hasResearchComponent(text),true);
 assert(text.includes('È prevista una tesi di laurea magistrale'));
 assert(!text.includes('unrelated programme'));
 assert.equal(text.match(/tesi di laurea magistrale/g).length,1);
});

test('Padova cannot borrow a panel from another title, degree node or rendered field',()=>{
 for(const options of [{heading:'OTHER COURSE'},{node:{type:'node--news'}},{node:{path:{alias:'/news/computer-engineering'}}},{dataRef:'$e'},{duplicate:true}])assert.equal(hasResearchComponent(programmeText(fixture(options))),false);
});

test('Padova requires public course data and an available disclosure control',()=>{
 for(const options of [{hidden:true},{node:{status:false}},{paragraph:{status:false}},{paragraph:{field_publish:false}},{paragraph:{field_roles:['authenticated']}},{paragraph:{field_paragraph_publish_on:'2030-01-01'}}])assert.equal(hasResearchComponent(programmeText(fixture(options))),false);
 assert.equal(hasResearchComponent(programmeText(fixture({body:'<div hidden>'+thesis+'</div><p>Overview</p>'}))),false);
});

test('Padova rejects malformed, ambiguous and executable transport content',()=>{
 for(const options of [{byteLength:thesis.length},{stream:s=>s+'c:T1,x'},{stream:s=>s.replace('d:[','d:invalid[')}])assert.equal(hasResearchComponent(programmeText(fixture(options))),false);
 const executable=fixture().replace('self.__next_f.push([1,','self.__next_f.push([runRemoteCode(),');
 assert.equal(hasResearchComponent(programmeText(executable)),false);
});
