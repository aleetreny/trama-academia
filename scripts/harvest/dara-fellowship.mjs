import {clean} from './domain.mjs';

const excluded='nav,aside,header,footer,form,[role="navigation"],[role="banner"],[hidden],[aria-hidden="true"],[style*="display:none"],[style*="display: none"]';

// DARA's call template puts only the title in main and the actual call in its
// next sibling. Recover that one visible, labelled call, not other page cards.
export function restoreDaraFellowshipPanel($){
 const main=$('body.body-4-base-inverse > div.page-wrap-3 > main.main-wrap-8');
 if(main.length!==1||$('main').length!==1||main.closest(excluded).length)return;
 const heading=main.find('section.hero-area h2.heading-two');
 if(heading.length!==1||heading.closest(excluded).length||main.find('h1').length)return;
 const title=clean(heading.text());
 if(!/^DARA Open Fellowship Call - (?:Winter|Summer) \d{4}(?:\/\d{2,4})?$/.test(title))return;
 const sections=main.siblings('section.solution-area-base');
 // Multiple candidate call sections are ambiguous even if one looks complete.
 if(sections.length!==1||sections.closest(excluded).length)return;
 const panel=sections.children('div.w-layout-grid.grid-64').children('div.rich-text-block-9.w-richtext');
 if(panel.length!==1||panel.closest(excluded).length)return;
 const headings=panel.children('h3').filter((_,e)=>!$(e).closest(excluded).length).map((_,e)=>clean($(e).text())).get();
 if(headings[0]!=='Introduction'||['Scientific Scope','Eligibility','Funding and Fellowship Benefits','Application Requirements','Important Dates'].some(label=>headings.filter(h=>h===label).length!==1))return;
 const copy=panel.clone();
 copy.find('script,style,noscript,'+excluded).remove();
 copy.find('p,h2,h3,h4,li,td,th').prepend(' ').append(' ');
 // A real page heading in main also prevents a newsletter h1 outside it from
 // being mistaken for this call's title by the general academic-page reader.
 heading.replaceWith($('<h1>').text(title));
 main.append(' ',copy);
}
