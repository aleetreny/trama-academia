import {parse} from 'acorn';
import {load} from 'cheerio';
import {clean} from './domain.mjs';
import {programmeText} from './programme-evidence.mjs';

const property=(node,key)=>{
 if(node?.type!=='ObjectExpression'||node.properties.some(p=>p.type!=='Property'||p.computed||p.method||p.kind!=='init'))return null;
 const matches=node.properties.filter(p=>p.type==='Property'&&!p.computed&&!p.method&&(p.key.name||p.key.value)===key);
 return matches.length===1?matches[0].value:null;
};
const literal=node=>node?.type==='Literal'?node.value:undefined;

// Read literal fields from the exact Nuxt route/programme reviewed in a browser.
// The AST is inspected, never evaluated. Other programme, state and menu data
// cannot supply evidence, and variable/computed content remains unsupported.
export function nuxtProgrammeText(html,url,programmeId){
 if(!programmeId)throw new Error('nuxt_programme_identity_required');
 const $=load(html),matches=[];
 for(const element of $('script:not([src])').toArray()){
  const source=$(element).text();if(!/^\s*window\.__NUXT__\s*=/.test(source)||source.length>1_000_000)continue;
  let tree;try{tree=parse(source,{ecmaVersion:2022});}catch{continue;}
  const assignment=tree.body.length===1&&tree.body[0].type==='ExpressionStatement'&&tree.body[0].expression;
  if(assignment?.type!=='AssignmentExpression'||assignment.operator!=='='||assignment.left.type!=='MemberExpression'||assignment.left.computed||assignment.left.object.name!=='window'||assignment.left.property.name!=='__NUXT__')continue;
  const call=assignment.right;if(call.type!=='CallExpression'||call.callee.type!=='FunctionExpression')continue;
  if(call.arguments.some(a=>a.type!=='Literal'&&!(a.type==='ObjectExpression'&&a.properties.length===0)))continue;
  const returns=call.callee.body.body.filter(x=>x.type==='ReturnStatement');if(returns.length!==1)continue;
  const parameters=new Set(call.callee.params.filter(p=>p.type==='Identifier').map(p=>p.name));
  const body=call.callee.body.body;
  if(body.at(-1)!==returns[0]||body.slice(0,-1).some(s=>{
   const e=s.expression;
   return s.type!=='ExpressionStatement'||e?.type!=='AssignmentExpression'||e.operator!=='='||e.left.type!=='MemberExpression'||e.left.computed||!parameters.has(e.left.object.name)||!['Literal','Identifier'].includes(e.right.type)||(e.right.type==='Identifier'&&!parameters.has(e.right.name));
  }))continue;
  const value=returns[0].argument;
  if(literal(property(value,'routePath'))!==new URL(url).pathname)continue;
  const data=property(value,'data');if(data?.type!=='ArrayExpression')continue;
  for(const item of data.elements){
   const programmes=property(item,'programmes');if(programmes?.type!=='ArrayExpression')continue;
   for(const programme of programmes.elements){
    if(String(literal(property(programme,'id')))!==String(programmeId))continue;
    const name=literal(property(programme,'Name')),description=literal(property(programme,'Description')),short=literal(property(programme,'PershkrimShkurter'));
    if(typeof name!=='string'||!name.trim()||typeof description!=='string'||!description.trim())continue;
    matches.push(clean(name+' '+programmeText('<main>'+description+'</main>')+' '+(typeof short==='string'?short:'')));
   }
  }
 }
 if(matches.length!==1)throw new Error('nuxt_programme_content_missing_or_ambiguous');
 return matches[0];
}
