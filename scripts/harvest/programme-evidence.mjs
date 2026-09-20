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
 const $=load(html);restoreStreamedBoundaries($);
 // Reading places a real mobile tab trigger inside a header and gives it the
 // unusual role=tabpanel. Capture only its reciprocal, same-section panel before
 // removing headers; navigation and arbitrary hidden fragments stay excluded.
 const readingPanels=[];
 $('header.mobile-tabs > h2.panel-trigger[role="tabpanel"][aria-controls][aria-expanded][id]').each((_,element)=>{
  const trigger=$(element),id=trigger.attr('aria-controls');
  if(!/^Panel\d+$/.test(id)||trigger.attr('id')!==id+'Trigger'||trigger.closest('nav,aside,footer,[role="navigation"],[role="banner"],[hidden],[aria-hidden="true"],[style*="display:none"],[style*="display: none"]').length)return;
  const panel=trigger.parent().siblings(`div.tabcontent[role="tabpanel"][id="${id}"][aria-labelledby="${id}Trigger"]`);
  if(panel.length===1&&$(`[id="${id}"]`).length===1&&$(`[id="${id}Trigger"]`).length===1)readingPanels.push(id);
 });
 $('script,style,noscript,nav,header,footer,select,textarea,[role="listbox"]').remove();
 // Bielefeld's recent-page history is a plain div and can name unrelated
 // degrees. Match that specific history link, not academic Studienverlauf.
 $('div.menulinks:has(> strong > a[href*="/sinfo/publ/Verlauf.jsp"])').remove();
 // Contact-form dropdowns can list every degree at the university. Their options
 // are not evidence of this programme's discipline or research component. Keep
 // the enclosing form: older academic sites wrap real content in a server form.
 const controlled=new Set([...readingPanels,...$('button[aria-controls],[role="button"][aria-controls],[role="tab"][aria-controls]')
  .filter((_,e)=>!$(e).closest('[hidden],[aria-hidden="true"],[style*="display:none"],[style*="display: none"]').length)
  .map((_,e)=>$(e).attr('aria-controls').trim().split(/\s+/)).get()]);
 // Swansea's own entry requirements and module list open in Bootstrap modals.
 // Require a visible button, one labelled dialog and its body in the same main.
 $('main button[data-bs-toggle="modal"][data-bs-target]').each((_,element)=>{
  const trigger=$(element),target=trigger.attr('data-bs-target');
  if(!/^#(?:entry-requirements|modules)-modal$/.test(target)||trigger.is('[disabled],[aria-disabled="true"]')||trigger.closest('aside,[role="navigation"],[role="banner"],[hidden],[aria-hidden="true"],[style*="display:none"],[style*="display: none"]').length)return;
  const id=target.slice(1),panel=$(`div.modal[id="${id}"][role="dialog"][aria-modal="true"][aria-labelledby="${id}-title"]`);
  if(panel.length===1&&$(`[id="${id}"]`).length===1&&$(`[id="${id}-title"]`).length===1&&panel.find(`h2.modal-title[id="${id}-title"]`).length===1&&panel.find('.modal-body').length===1&&panel.closest('main')[0]===trigger.closest('main')[0])controlled.add(id);
 });
 // Kent's international requirements use an Alpine tab without aria-controls.
 // Match its literal local switcher pair; never execute the Alpine expression.
 $('main section#entry-requirements div.switcher#entry-switcher a.button.switcher__link#entry-international[href="#tab--entry-international"]').each((_,element)=>{
  const trigger=$(element),switcher=trigger.closest('div.switcher#entry-switcher'),id='tab--entry-international';
  if(trigger.attr('@click.prevent')!=="tab='tab--entry-international'"||trigger.is('[aria-disabled="true"]')||trigger.closest('aside,[role="navigation"],[role="banner"],[hidden],[aria-hidden="true"],[style*="display:none"],[style*="display: none"]').length)return;
  const panel=switcher.children(`div.panel.panel--switcher[role="tabpanel"][id="${id}"]`);
  if(panel.length===1&&panel.attr('x-show')==="tab === 'tab--entry-international'"&&$(`[id="${id}"]`).length===1&&$('[id="entry-international"]').length===1&&$('[id="entry-switcher"]').length===1)controlled.add(id);
 });
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
 // Leeds and Liverpool put their own academic facts before main. Preserve only
 // one visible fact block; related course cards must not supply its duration.
 const facts=$('.uol-key-facts,dl.rb-course-details').filter((_,element)=>!$(element).closest('main,aside,[role="navigation"],[role="banner"],[style*="display:none"],[style*="display: none"]').length);
 const academicFacts=main.length&&facts.length===1?facts.text()+' ':'';
 return clean(title+academicFacts+(main.length?main:$('body')).text());
}
export function hasResearchComponent(text){
 text=String(text).normalize('NFC');
 // Ioannina's regulation names a postgraduate dissertation in the genitive.
 if(/(?<!\p{L})μεταπτυχιακής\s+διπλωματικής\s+εργασίας(?!\p{L})/iu.test(text))return true;
 // The TUI course PDF splits a diacritic inside its dissertation title. Require
 // its assigned Master level, programme, course label and code together.
 const courseRecord=clean(text.replace(/[\u200B\uFEFF]/g,''));
 if(/\b1\.5 Ciclul de studii (?:1 )?Master 1\.6 Programul de studii Securitatea spatiului cibernetic 2\.1 Denumirea disciplinei\/Cod Elaborare proiect de diserta [țţ] ie \/ SSC\.PA\.206\b/iu.test(courseRecord))return true;
 // Named master's dissertations in Finnish, Romanian and Greek curricula.
 // A seminar, an undergraduate thesis or an internship alone is insufficient.
 if(/\bpro\s+gradu\s*[-–—]?\s*tutkielma(?:n)?\b/i.test(text))return true;
 if(/\bteza de master\b|\bproiect(?:ului)?(?: de)? diserta[țţt]ie\b|\blucr[ăa]rii de diserta[țţt]ie\b/iu.test(text))return true;
 if(/διατριβ[ήη]ς?\s+μ[άα]στερ/iu.test(text))return true;
 // A professional capstone described as replacing a dissertation is not
 // positive evidence of a dissertation. Other explicit research routes remain.
 text=text.replace(/\b(?:instead of|rather than|in place of|as an alternative to)\s+(?:(?:a|an|the|traditional|standard|conventional|research|project)\s+)*(?:dissertation|thesis)\b/gi,' ');
 // DCU calls its final work a practicum and explicitly offers a theoretical
 // analysis route. A practicum without that academic description is not enough.
 if(/\bpracticum\b/i.test(text)&&/\brigorous theoretical analysis\b/i.test(text))return true;
 // Kent describes its supervised Data Science Project as an extended piece of
 // research, followed by a written report, rather than naming a dissertation.
 if(/\bcarry out an extended piece of research\b/i.test(text))return true;
 // Yildiz course tables join the thesis title to its course code. Match the
 // actual thesis title, not "Tezsiz Yuksek Lisans" (a non-thesis degree).
 if(/yüksek lisans tezi/i.test(text))return true;
 // Fribourg names the final research dissertation "travail de master".
 if(/\btravail de master\b/i.test(text))return true;
 // Brest's master's regulations explicitly require preparation and defence.
 if(/подготовку к защите и защиту магистерской диссертации/i.test(text))return true;
 // Czech programme rules use the genitive when describing defence of the thesis.
 if(/\bdiplomov[ée]\s+pr[áa]ce\b/i.test(text))return true;
 // Silesia describes preparing and defending the master's thesis in accusative.
 if(/pracę\s+magisterską/i.test(text))return true;
 // Stuttgart's curriculum wraps "Master-Arbeit" across two PDF lines.
 if(/\bmaster\s*[-–]?\s*arbeit\b/i.test(text))return true;
 // Lyon's curricula name research internships and a research-focused master's
 // degree explicitly. Generic work placements or research career prospects do not suffice.
 if(/\bresearch internships?\b|\bstages? de recherche\b|\bresearch[- ]focused master(?:s|[’']s)? degree\b/i.test(text))return true;
 return /\bthes(?:is|es)\b|dissertation|disserta[çc](?:[aã]o|[oõ]es)|tese de mestrado|tesi (?:di laurea|magistrale)|argomento di tesi|research project|research.oriented|independent research|master[’']?s?\s+(?:degree\s+)?(?:final\s+)?project|mémoire|stage de recherche|stage[^.!?;]{0,90}laboratoire de recherche|travail de fin d[’']études|master[ -]?arbeit|praca\s+(?:dyplomowa\s+)?magisterska|pracy\s+magisterskiej|\bdiplomamunka\b|\bkandidatspeciale\b|\bmikrotez[ëe](?![a-zë])|\bmasterverkætlan|\bmasterritgerð|trabajo\s+(?:de\s+)?fin(?:al)?\s+(?:de\s+)?m[aá]ster|treball final de m[aà]ster|projet\s+(?:de\s+)?recherche|diplomov[áa]\s*pr[áa]c[ae]|diplomovej\s+pr[áa]ce|metodol[óo]gia\s+v[ýy]skumu/i.test(text);
}
