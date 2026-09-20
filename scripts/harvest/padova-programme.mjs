import {clean} from './domain.mjs';

// Read literal Flight transport records, never execute a script or request a
// URL contained in its metadata. T records use UTF-8 byte lengths, not JS length.
function flightRecords($){
 const chunks=[];
 for(const script of $('script:not([src])').toArray()){
  const source=$(script).text(),match=source.match(/^\s*self\.__next_f\.push\((\[.*\])\);?\s*$/s);
  if(!match)continue;
  try{const value=JSON.parse(match[1]);if(value.length===2&&value[0]===1&&typeof value[1]==='string')chunks.push(value[1]);}catch{ /* Non-literal scripts are not evidence. */ }
 }
 const bytes=Buffer.from(chunks.join(''));
 if(!bytes.length||bytes.length>8_000_000)return null;
 const records=new Map();let offset=0,rows=0;
 while(offset<bytes.length){
  if(++rows>10_000)return null;
  const header=bytes.subarray(offset,offset+24).toString('ascii').match(/^([a-f0-9]*):/);
  if(!header)return null;
  const id=header[1];offset+=header[0].length;
  const tag=String.fromCharCode(bytes[offset]);let value,keep=false;
  if('TAOoUSsLlGgMmV'.includes(tag)){
   const length=bytes.subarray(offset+1,offset+24).toString('ascii').match(/^([a-f0-9]+),/);
   if(!length)return null;
   offset+=1+length[0].length;
   const end=offset+parseInt(length[1],16);
   if(end>bytes.length)return null;
   if(tag==='T'){
    const raw=bytes.subarray(offset,end);value=raw.toString('utf8');
    if(!Buffer.from(value).equals(raw))return null;
    keep=true;
   }
   offset=end;
  }else{
   const end=bytes.indexOf(10,offset);if(end<0)return null;
   const row=bytes.subarray(offset,end).toString('utf8');offset=end+1;
   // Imports, hints and errors are not programme content.
   if(/^[\[{"]/.test(row)){try{value=JSON.parse(row);keep=true;}catch{return null;}}
  }
  if(keep){if(!id||records.has(id))return null;records.set(id,value);}
 }
 return records;
}

function resolve(records,value){
 let depth=0;
 while(typeof value==='string'&&/^\$L?[a-f0-9]+(?::[\w-]+)*$/.test(value)){
  if(++depth>16)return undefined;
  const [id,...path]=value.replace(/^\$L?/,'').split(':');value=records.get(id);
  for(const key of path){
   if(['__proto__','constructor','prototype'].includes(key))return undefined;
   if(key==='props'&&Array.isArray(value)&&value[0]==='$')value=value[3];
   else value=value&&Object.hasOwn(value,key)?value[key]:undefined;
  }
 }
 return value;
}

function renderedDataMatches(tree,records,node,paragraph){
 let count=0,visited=0;
 function visit(value){
  if(++visited>1000)return;
  if(!Array.isArray(value))return;
  if(value[0]==='$'){
   const props=value[3];if(!props||typeof props!=='object')return;
   if(resolve(records,props.node)===node&&resolve(records,props.data)===paragraph)count++;
   visit(props.children);
  }else for(const child of value)visit(child);
 }
 visit(tree);return visited<=1000&&count===1;
}

export function restorePadovaCoursePanel($){
 const main=$('main'),heading=main.find('h1');
 if(main.length!==1||heading.length!==1||$('meta[property="og:url"][content="https://www.unipd.it"]').length!==1)return;
 const tabs=main.find('[role="tablist"][aria-label="Sidebar tabs"]');
 const trigger=tabs.find('button[role="tab"]').filter((_,e)=>clean($(e).text())==='Caratteristiche e ambiti');
 if(tabs.length!==1||trigger.length!==1||trigger.is(':disabled,[aria-disabled="true"]')||trigger.closest('nav,aside,[hidden],[aria-hidden="true"],[style*="display:none"],[style*="display: none"]').length)return;
 const records=flightRecords($);if(!records)return;
 const candidates=[];
 for(const value of records.values()){
  if(!Array.isArray(value)||value[0]!=='$')continue;
  const props=value[3],node=resolve(records,props?.node);
  if(node?.type!=='node--didattica'||node.status!==true||node.langcode!=='it'||clean(node.title)!==clean(heading.text())||!/^\/corsi-di-laurea\/[^/]+$/.test(node.path?.alias||''))continue;
  const paragraphs=node.field_caratteristiche_e_ambiti,sections=resolve(records,props.renderedFields?.field_caratteristiche_e_ambiti);
  if(!Array.isArray(paragraphs)||!paragraphs.length||paragraphs.length>10||!Array.isArray(sections)||sections.length!==paragraphs.length)continue;
  const html=[];
  for(const paragraph of paragraphs){
   const matching=sections.filter(s=>Array.isArray(s)&&s[0]==='$'&&s[1]==='section'&&s[2]===paragraph.id&&s[3]?.id===paragraph.id&&s[3]?.className==='editorial');
   if(paragraph.type!=='paragraph--editorial'||paragraph.status!==true||paragraph.field_publish!==true||paragraph.langcode!=='it'||!Array.isArray(paragraph.field_roles)||paragraph.field_roles.length||paragraph.field_paragraph_publish_on||paragraph.field_paragraph_unpublish_on||matching.length!==1||!renderedDataMatches(matching[0],records,node,paragraph))break;
   const body=resolve(records,paragraph.field_content?.processed);
   if(typeof body!=='string'||!body.trim().startsWith('<')||body.length>200_000)break;
   html.push(body);
  }
  if(html.length===paragraphs.length)candidates.push(html);
 }
 if(candidates.length!==1)return;
 const panel=$('<section>').append(candidates[0].join(' '));
 panel.find('script,style,noscript,nav,aside,header,footer,form,[hidden],[aria-hidden="true"],[style*="display:none"],[style*="display: none"]').remove();
 main.append(' ',panel);
}
