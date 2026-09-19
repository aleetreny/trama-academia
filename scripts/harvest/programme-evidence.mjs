import {load} from 'cheerio';
import {clean} from './domain.mjs';
function restoreStreamedBoundaries($){
 // React's completed Suspense fragments are initially hidden outside <main>.
 // Resolve only explicit successful B:/S: pairs with an intact boundary. Never
 // execute remote scripts or treat an arbitrary hidden fragment as visible.
 const pairs=[];
 $('script').each((_,script)=>{
  for(const match of $(script).text().matchAll(/(?:^|[;\n])\s*\$RC\(["'](B:[\w-]+)["']\s*,\s*["'](S:[\w-]+)["']\s*\)/g))pairs.push([match[1],match[2]]);
 });
 for(const [boundaryId,segmentId] of pairs.slice(0,1000)){
  const boundary=$(`template[id="${boundaryId}"]`),segment=$(`div[hidden][id="${segmentId}"]`);
  if(boundary.length!==1||segment.length!==1||boundary.parents().toArray().includes(segment[0]))continue;
  const before=boundary[0].prev;
  if(before?.type!=='comment'||!['$?','$~'].includes(before.data))continue;
  const fallback=[];let node=boundary[0],depth=0,closing=null;
  while(node&&fallback.length<10000){
   if(node.type==='comment'){
    if(['/$','/&'].includes(node.data)){if(depth===0){closing=node;break;}depth--;}
    else if(['$','$?','$~','$!','&'].includes(node.data))depth++;
   }
   fallback.push(node);node=node.next;
  }
  if(!closing)continue;
  boundary.before(segment.contents());
  for(const item of fallback)$(item).remove();
  segment.remove();before.data='$';
 }
}
export function programmeText(html){
 const $=load(html);restoreStreamedBoundaries($);$('script,style,noscript,nav,header,footer').remove();
 const controlled=new Set($('button[aria-controls],[role="tab"][aria-controls]').map((_,e)=>$(e).attr('aria-controls')).get());
 $('[hidden],[aria-hidden="true"]').each((_,element)=>{
  const item=$(element),id=item.attr('id');
  // Programme details may be initially collapsed but available through a real
  // disclosure button. Preserve those panels, never generic hidden templates.
  const disclosure=(id&&controlled.has(id))||(/accordion.*content/i.test(item.attr('class')||'')&&item.siblings('button[aria-expanded]').length>0);
  if(!disclosure)item.remove();
 });
 return clean(($('main').length?$('main'):$('body')).text());
}
export function hasResearchComponent(text){
 return /\bthes(?:is|es)\b|dissertation|disserta[çc](?:[aã]o|[oõ]es)|tese de mestrado|tesi (?:di laurea|magistrale)|research project|research.oriented|research skills|master[’']?s?\s+(?:degree\s+)?(?:final\s+)?project|mémoire|stage de recherche|stage[^.!?;]{0,90}laboratoire de recherche|travail de fin d[’']études|masterarbeit|\bkandidatspeciale\b|\bmikrotez[ëe](?![a-zë])|\bmasterverkætlan|\bmasterritgerð|trabajo\s+(?:de\s+)?fin(?:al)?\s+(?:de\s+)?m[aá]ster|treball final de m[aà]ster|projet\s+(?:de\s+)?recherche|diplomov[áa]\s*pr[áa]c[ae]|diplomovej\s+pr[áa]ce|metodol[óo]gia\s+v[ýy]skumu/i.test(text);
}
