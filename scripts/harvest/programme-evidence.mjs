import {load} from 'cheerio';
import {clean} from './domain.mjs';
export function programmeText(html){
 const $=load(html);$('script,style,noscript,nav,header,footer').remove();
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
 return /thesis|dissertation|disserta[çc][aã]o|tesi (?:di laurea|magistrale)|research project|research.oriented|research skills|master[’']?s?\s+(?:degree\s+)?(?:final\s+)?project|mémoire|stage de recherche|stage[^.!?;]{0,90}laboratoire de recherche|travail de fin d[’']études|masterarbeit|trabajo\s+(?:de\s+)?fin\s+(?:de\s+)?m[aá]ster|treball final de m[aà]ster|projet\s+(?:de\s+)?recherche/i.test(text);
}
