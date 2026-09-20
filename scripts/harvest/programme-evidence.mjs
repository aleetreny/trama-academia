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
 const $=load(html);restoreStreamedBoundaries($);$('script,style,noscript,nav,header,footer,select,textarea,[role="listbox"]').remove();
 // Bielefeld's recent-page history is a plain div and can name unrelated
 // degrees. Match that specific history link, not academic Studienverlauf.
 $('div.menulinks:has(> strong > a[href*="/sinfo/publ/Verlauf.jsp"])').remove();
 // Contact-form dropdowns can list every degree at the university. Their options
 // are not evidence of this programme's discipline or research component. Keep
 // the enclosing form: older academic sites wrap real content in a server form.
 const controlled=new Set($('button[aria-controls],[role="button"][aria-controls],[role="tab"][aria-controls]')
  .filter((_,e)=>!$(e).closest('[hidden],[aria-hidden="true"],[style*="display:none"],[style*="display: none"]').length)
  .map((_,e)=>$(e).attr('aria-controls').trim().split(/\s+/)).get());
 $('[hidden],[aria-hidden="true"]').each((_,element)=>{
  const item=$(element),id=item.attr('id');
  // Programme details may be initially collapsed but available through a real
  // disclosure button. Preserve those panels, never generic hidden templates.
  const disclosure=(id&&controlled.has(id))||(/accordion.*content/i.test(item.attr('class')||'')&&item.siblings('button[aria-expanded]').length>0);
  if(!disclosure)item.remove();
 });
 const main=$('main');
 // Some university templates place the page title immediately before <main>.
 // Preserve a single visible page heading, but never headings from navigation,
 // hidden templates or sidebars, nor a second title when main already has one.
 const headings=$('h1').filter((_,element)=>!$(element).closest('main,aside,[role="navigation"],[role="banner"],[style*="display:none"],[style*="display: none"]').length);
 const title=main.length&&!main.find('h1').length&&headings.length===1?headings.text()+' ':'';
 // Leeds puts its own academic facts before main; related course cards inside
 // main have separate durations and must not replace these programme facts.
 const facts=$('.uol-key-facts').filter((_,element)=>!$(element).closest('main,aside').length);
 const academicFacts=main.length&&facts.length===1?facts.text()+' ':'';
 return clean(title+academicFacts+(main.length?main:$('body')).text());
}
export function hasResearchComponent(text){
 // A professional capstone described as replacing a dissertation is not
 // positive evidence of a dissertation. Other explicit research routes remain.
 text=text.replace(/\b(?:instead of|rather than|in place of|as an alternative to)\s+(?:(?:a|an|the|traditional|standard|conventional|research|project)\s+)*(?:dissertation|thesis)\b/gi,' ');
 // DCU calls its final work a practicum and explicitly offers a theoretical
 // analysis route. A practicum without that academic description is not enough.
 if(/\bpracticum\b/i.test(text)&&/\brigorous theoretical analysis\b/i.test(text))return true;
 // Yildiz course tables join the thesis title to its course code. Match the
 // actual thesis title, not "Tezsiz Yuksek Lisans" (a non-thesis degree).
 if(/yüksek lisans tezi/i.test(text))return true;
 // Fribourg names the final research dissertation "travail de master".
 if(/\btravail de master\b/i.test(text))return true;
 // Brest's master's regulations explicitly require preparation and defence.
 if(/подготовку к защите и защиту магистерской диссертации/i.test(text))return true;
 return /\bthes(?:is|es)\b|dissertation|disserta[çc](?:[aã]o|[oõ]es)|tese de mestrado|tesi (?:di laurea|magistrale)|argomento di tesi|research project|research.oriented|independent research|master[’']?s?\s+(?:degree\s+)?(?:final\s+)?project|mémoire|stage de recherche|stage[^.!?;]{0,90}laboratoire de recherche|travail de fin d[’']études|master[ -]?arbeit|praca\s+(?:dyplomowa\s+)?magisterska|pracy\s+magisterskiej|\bdiplomamunka\b|\bkandidatspeciale\b|\bmikrotez[ëe](?![a-zë])|\bmasterverkætlan|\bmasterritgerð|trabajo\s+(?:de\s+)?fin(?:al)?\s+(?:de\s+)?m[aá]ster|treball final de m[aà]ster|projet\s+(?:de\s+)?recherche|diplomov[áa]\s*pr[áa]c[ae]|diplomovej\s+pr[áa]ce|metodol[óo]gia\s+v[ýy]skumu/i.test(text);
}
