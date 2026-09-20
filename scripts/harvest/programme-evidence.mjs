import {load} from 'cheerio';
import {clean} from './domain.mjs';
import {restorePadovaCoursePanel} from './padova-programme.mjs';
const hiddenOrNavigation='nav,aside,footer,[role="navigation"],[role="banner"],[hidden],[aria-hidden="true"],[style*="display:none"],[style*="display: none"]';
function degreeAdmissionPanels($){
 // Radboud's visible previous-degree selector opens two labelled regions. The
 // same data-id also occurs in calendars and manuals; each accepted region
 // needs its own control, section and label before it can supply facts.
 const panels=new Set();
 $('div.node--type-admission-reqs-ma.node--full .section--selections select#prev-education.content-selector__options').each((_,element)=>{
  const control=$(element),owner=control.closest('div.node--type-admission-reqs-ma.node--full');
  if($('select#prev-education').length!==1||control.is(':disabled,[aria-disabled="true"]')||control.closest(hiddenOrNavigation).length)return;
  for(const label of ['Dutch degree','Non-Dutch degree']){
   const option=control.children('option').filter((_,e)=>clean($(e).text())===label),value=option.attr('value');
   if(option.length!==1||!/^prev-education-[12]$/.test(value||''))continue;
   const region=owner.find('.section--admission-requirements').children(`div[role="region"][data-id="${value}"][aria-label="Admission requirements ${label}"]`);
   if(region.length===1&&region.parent().closest(hiddenOrNavigation).length===0&&clean(region.find('h2').first().text())===label){region.find('h2').first().after(' ');panels.add(region[0]);}
  }
  // Calendars depend on both nationality and previous education. Preserve all
  // six controlled combinations with their source labels, never a bare date.
  const nationality=owner.find('.section--selections select#admissions-period.content-selector__options');
  if(nationality.length!==1||$('select#admissions-period').length!==1||nationality.is(':disabled,[aria-disabled="true"]')||nationality.closest(hiddenOrNavigation).length)return;
  const degrees=['Dutch degree','Non-Dutch degree'].map(label=>({label,options:control.children('option').filter((_,e)=>clean($(e).text())===label)}));
  if(degrees.some(x=>x.options.length!==1||!/^prev-education-[12]$/.test(x.options.attr('value')||''))||new Set(degrees.map(x=>x.options.attr('value'))).size!==2)return;
  for(const label of ['Dutch','EU/EEA country','Non-EU/EEA country']){
   const option=nationality.children('option').filter((_,e)=>clean($(e).text())===label),value=option.attr('value');
   if(option.length!==1||!/^admissions-period-[123]$/.test(value||''))continue;
   const calendar=owner.find('div.section').children(`div[role="region"][data-id="${value}"][aria-label="Application period ${label}"]`);
   if(calendar.length!==1||calendar.parent().closest(hiddenOrNavigation).length)continue;
   const combinations=degrees.map(x=>({...x,region:calendar.children(`div[role="region"][data-id="${x.options.attr('value')}"]`)}));
   if(combinations.some(x=>x.region.length!==1||x.region.children('.section--deadlines').length!==1||clean(x.region.children('.section--deadlines').children('h3').first().text())!=='Application period'))continue;
   calendar.prepend($('<p>').text(calendar.attr('aria-label')+' '));panels.add(calendar[0]);
   calendar.children('div[role="region"][data-id="prev-education-0"]').remove();
   for(const {label:degreeLabel,region} of combinations){region.prepend($('<p>').text(degreeLabel+' '));panels.add(region[0]);}
  }
 });
 return panels;
}
function restoreSelectedCourseHeaders($){
 // Antwerp serves several academic years in one response. Keep the selected
 // year's course titles only when their link, year and visible code agree.
 $('section.pane.stateActive[id]').each((_,element)=>{
  const pane=$(element),match=(pane.attr('id')||'').match(/^(M\d{7})-(\d{4})$/);
  if(!match||pane.closest(hiddenOrNavigation).length)return;
  const siblings=pane.parent().children('section.pane[id]').filter((_,e)=>new RegExp('^'+match[1]+'-\\d{4}$').test($(e).attr('id')||''));
  if(siblings.filter('.stateActive').length!==1||!pane.find('section.programmes').length)return;
  siblings.not(pane).remove();
  pane.find('section.course > header > h5.heading > a[href]').each((_,link)=>{
   const heading=$(link),header=heading.closest('header'),course=header.parent('section.course');
   const code=clean(course.children('div.mainCourse').find('.spec.guideNr > .value').text());
   const ref=(heading.attr('href')||'').match(/^\?id=(\d{4})-([A-Za-z0-9]+)(?:&|$)/);
   if(ref&&ref[1]===match[2]&&ref[2]===code&&course.closest(hiddenOrNavigation).length===0&&header.children('h5.heading').length===1&&course.children('div.mainCourse').find('.spec.points > .value').length===1)header.replaceWith(header.contents());
  });
 });
}
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
 const $=load(html);restoreStreamedBoundaries($);restorePadovaCoursePanel($);
 const degreePanels=degreeAdmissionPanels($);restoreSelectedCourseHeaders($);
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
  const disclosure=degreePanels.has(element)||(id&&controlled.has(id))||(/accordion.*content/i.test(item.attr('class')||'')&&item.siblings('button[aria-expanded]').length>0);
  if(!disclosure)item.remove();
 });
 // Ametys can join the visible module heading directly to the ECTS label.
 // Restore the heading boundary instead of weakening the thesis word boundary.
 $('h1.ametys-main-banner-alt__title').after(' ');
 // EHU's own research-line table is minified. Restore its cell/list boundaries
 // while preserving the established evidence text of other institutional sites.
 const lines=$('div.upv-tabla > table#tableSearchProfesorado');
 if(lines.length===1&&$('#tableSearchProfesorado').length===1&&clean(lines.children('caption').text())==='Equipos y líneas de investigación'&&lines.find('thead > tr > th').map((_,e)=>clean($(e).text())).get().join('|')==='Equipos de investigación|Líneas de investigación')lines.find('li,td,th').prepend(' ').append(' ');
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
 // Belgrade names the master's dissertation in its own second-cycle study
 // plan. The numerical course columns are not part of the dissertation name.
 if(/(?<!\p{L})МАСТЕР СТУДИЈЕ МАТЕМАТИКА(?!\p{L})/iu.test(text)&&/Математика - 1 година, 60 ЕСПБ/iu.test(text)&&/(?<!\p{L})Дипломски мастер рад(?=\d|\s|$)/iu.test(text))return true;
 // Banja Luka's second-cycle CS curriculum separates compulsory research
 // (10 ECTS) and final work (20 ECTS); the A legend explicitly means mandatory.
 if(/РАЧУНАРСТВО И ИНФОРМАТИКА II ЦИКЛУС/iu.test(text)&&/Студијски истраживачки рад 2 10 8 A 18\. Завршни рад 2 20 16 A/iu.test(text)&&/A Обавезни предмет на студијском програму/iu.test(text))return true;
 // Sarajevo's own MIS master's curriculum requires a project and master's
 // dissertation. Neither a generic final project nor a first-cycle page fits.
 if(/II ciklusa studija \(master studij\)/iu.test(text)&&/zvanje: magistar menadžmenta, smjer Menadžment i informacioni sistemi/iu.test(text)&&/(?<!\p{L})Izrada projekta i master rada(?!\p{L})/iu.test(text))return true;
 // Zagreb lists the dissertation as a coded, compulsory fourth-semester course.
 // "Diplomski rad" alone does not establish a master's research component:
 // require the second-cycle degree, its 120 ECTS and awarded master's title.
 if(/(?<!\p{L})Diplomski sveučilišni studij(?!\p{L})/iu.test(text)
  && /Dvije akademske godine \(tj\. četiri semestra\), 120 ECTS bodova/iu.test(text)
  && /Akademski naziv koji se stječe završetkom studija Magistar\/Magistra(?!\p{L})/iu.test(text)
  && /\b4\. semestar, 2\. godina ECTS Obvezni predmeti Eng\. raz\. Opterećenje Sem INFO 10[.,]0 Diplomski rad \(\d{4,8}\) - 1 \(1S\) 4 INFO/iu.test(text))return true;
 // Tartu explicitly reserves the last semester for writing the master's thesis.
 // The bare Estonian word also occurs in a TalTech degree replacing it by an exam.
 if(/(?<!\p{L})viimane semester on mõeldud magistritöö kirjutamiseks(?!\p{L})/iu.test(text))return true;
 // Lithuanian curricula name the master's final dissertation separately from
 // the bachelor's final work; keep the complete degree-qualified title.
 if(/(?<!\p{L})magistro\s+baigiamasis\s+darbas(?!\p{L})/iu.test(text))return true;
 // VU uses the instrumental form in an affirmative graduation requirement.
 if(/(?<!\p{L})Studijas užbaigsi magistro baigiamuoju darbu(?!\p{L})/iu.test(text))return true;
 // Ljubljana requires preparation, submission and public defence of the named
 // master's dissertation; a thesis seminar or a bachelor's work cannot match.
 if(/(?<!\p{L})skladno s pravili pripravljeno in oddano magistrsko delo ter uspešno opravljen javni zagovor magistrskega dela(?!\p{L})/iu.test(text))return true;
 // Sarajevo's second-cycle rules explicitly assign the master's dissertation
 // to semester IV. Its inconsistent ECTS totals remain an editorial caveat.
 if(/Pravila studiranja na II ciklusu studija/iu.test(text)&&/Stručni naziv koji se stiče je Magistar(?!\p{L})/iu.test(text)&&/(?<!\p{L})u IV semestru se radi magistarski rad(?!\p{L})/iu.test(text))return true;
 // FOI's own master curriculum separates the compulsory 24-ECTS dissertation
 // from the 6-ECTS placement. This is not an isolated "diploma work" match.
 if(/(?<!\p{L})Sveučilišni diplomski studijski programi(?!\p{L})/iu.test(text)&&/\bobvezno 69575 Diplomski rad 4 24 69576 Stručna praksa 4 6\b/iu.test(text))return true;
 // Rijeka has separate compulsory rows for the seminar and dissertation. Keep
 // the graduate degree context and the actual dissertation row together.
 if(/(?<!\p{L})Sveučilišni diplomski studij Diskretna matematika i primjene(?!\p{L})/iu.test(text)&&/(?<!\p{L})Sveučilišni magistar matematike(?!\p{L})/iu.test(text)&&/\bSemestar: 4 MODUL KOLEGIJ NOSITELJ P V S ECTS STATUS4 Seminar diplomskog rada 0 0 30 4 O Diplomski rad 4 O\b/iu.test(text))return true;
 // Modena's master's course ties its final thesis to original, autonomous work.
 // A generic final examination or the mention of a thesis alone is insufficient.
 if(/\bCorso di Laurea Magistrale\b/iu.test(text)&&/La prova finale è una occasione in cui viene richiesto agli studenti di svolgere un lavoro originale in forte autonomia\./u.test(text)&&/Anche la redazione di una tesi per la prova finale e la relativa esposizione/u.test(text))return true;
 // Cagliari explicitly offers a supervised scientific final-work route based
 // on critical literature analysis or original methods within its master's.
 if(/\bCorso di Laurea Magistrale\b/iu.test(text)&&/La prova finale consiste nella discussione di una relazione relativa ad un lavoro individuale, svolto dal laureando sotto la supervisione di almeno un docente/u.test(text)&&/un'analisi critica dello stato dell'arte/u.test(text)&&/lo sviluppo di metodologie e tecniche con un certo grado di originalità/u.test(text))return true;
 // Padua's regulation explicitly requires an original supervised thesis, but
 // its PDF uses the ligature in "finale" and calls the work simply "tesi".
 // Keep the master's context and the complete affirmative requirement.
 const italianFinalWork=clean(text.normalize('NFKC'));
 if(/\bCorso di laurea magistrale\b/iu.test(italianFinalWork)
  && /La prova finale consiste in una tesi elaborata in modo originale dallo studente sotto la guida di un relatore\./iu.test(italianFinalWork))return true;
 // Dutch curricula use masterproef/masterproeven for the master's dissertation.
 if(/(?<!\p{L})masterproe(?:f|ven)(?!\p{L})/iu.test(text))return true;
 // cog-SUP requires a research placement with preregistration and assessment.
 if(/\bDuring the M2, all students will do a long internship\b/i.test(text)&&/\bstudents will submit a preregistration document\b/i.test(text)&&/\bstudents will submit a full report and present in front of an interdisciplinary jury\b/i.test(text))return true;
 // Lyon describes this final placement across two sentences; the second ties
 // it explicitly to research training and a research laboratory.
 if(/\bstage de fin d[’']études\b[^.!?;]{0,150}\.\s*Il constitue une initiation aux métiers de la recherche,\s*il peut être effectué en laboratoire de recherche\b/i.test(text))return true;
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
