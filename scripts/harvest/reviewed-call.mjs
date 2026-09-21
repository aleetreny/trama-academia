import {load} from 'cheerio';
import {clean,canonicalUrl} from './domain.mjs';
const normalized=text=>clean(text).normalize('NFKC').toLowerCase();
const months=['january','february','march','april','may','june','july','august','september','october','november','december'];

function recentListing(seed,call,document,documents){
 const listing=call.listing,index=documents.get(listing?.sourceUrl);
 if(call.deadline||call.rolling||!index||!listing.title?.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(listing.date||''))throw new Error('invalid_undated_call');
 if(!normalized(document.text).includes(normalized(listing.title)))throw new Error('call_listing_title_mismatch');
 // Drupal's announcement card binds the publication date to this exact link.
 // A date elsewhere on the index, in navigation or in a hidden card is not proof.
 const $=load(index.body),dates=[],unavailable='nav,header,footer,aside,[hidden],[aria-hidden="true"],[style*="display:none"],[style*="display: none"]';
 $('.views-row').each((_,element)=>{
  const row=$(element);
  if(row.closest(unavailable).length)return;
  const links=row.children('.views-field-title').find('a[href]'),date=row.children('.views-field-created').find('.date');
  if(links.length!==1||date.length!==1||links.closest(unavailable).length||date.closest(unavailable).length)return;
  let url;try{url=canonicalUrl(new URL(links.attr('href'),index.finalUrl).href);}catch{return;}
  if(url!==canonicalUrl(call.sourceUrl||seed.url)||normalized(links.text())!==normalized(listing.title))return;
  dates.push(clean(date.text()));
 });
 const match=dates.length===1&&dates[0].match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
 if(!match)throw new Error('call_listing_date_missing');
 const iso=match[3]+'-'+match[2]+'-'+match[1],timestamp=Date.parse(iso+'T00:00:00Z');
 if(iso!==listing.date||!Number.isFinite(timestamp)||new Date(timestamp).toISOString().slice(0,10)!==iso)throw new Error('call_listing_date_mismatch');
 // Undated announcement pages can remain online for years. Only a recent
 // publication in the institution's index supports this limited listed status.
 for(const source of [document,index]){
  const age=Date.parse(source.checkedAt)-timestamp;
  if(!Number.isFinite(age)||age<0||age>30*86400000)throw new Error('call_listing_not_recent');
 }
 return {status:'listed',deadline:null,deadlinePrecision:null,publishedAt:iso+'T00:00:00Z',deadlineNote:'Anuncio publicado el '+dates[0]+' sin fecha límite indicada. Confirma que continúa disponible.'};
}

// A reviewed vacancy needs a witnessed deadline, a rolling statement or a
// recent dated announcement. Degree intake dates never create open vacancies.
export function reviewedCallStatus(seed,documents){
 if(seed.kind!=='position'){
  if(seed.call!==undefined)throw new Error('call_requires_position');
  return {status:'programme',deadline:null,deadlinePrecision:null};
 }
 const call=seed.call,document=documents.get(call?.sourceUrl||seed.url);
 if(!call?.sourceText?.trim()||!document||!normalized(document.text).includes(normalized(call.sourceText)))throw new Error('call_evidence_missing');
 if(call.listed===true)return recentListing(seed,call,document,documents);
 if(call.rolling===true){
  if(call.deadline||!/\brolling basis\b|\bthroughout the year\b/i.test(call.sourceText))throw new Error('invalid_rolling_call');
  return {status:'rolling',deadline:null,deadlinePrecision:null};
 }
 if(!/^\d{4}-\d{2}-\d{2}$/.test(call.deadline||''))throw new Error('invalid_call_deadline');
 const date=normalized(call.sourceText).match(/^deadline:\s*(january|february|march|april|may|june|july|august|september|october|november|december) (\d{1,2}), (\d{4})$/);
 if(!date)throw new Error('call_deadline_label_missing');
 const iso=date[3]+'-'+String(months.indexOf(date[1])+1).padStart(2,'0')+'-'+date[2].padStart(2,'0');
 const timestamp=Date.parse(iso+'T00:00:00Z');
 if(iso!==call.deadline||!Number.isFinite(timestamp)||new Date(timestamp).toISOString().slice(0,10)!==iso)throw new Error('call_deadline_mismatch');
 return {status:'open',deadline:iso,deadlinePrecision:'date'};
}
