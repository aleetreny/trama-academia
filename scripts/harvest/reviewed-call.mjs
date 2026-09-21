import {load} from 'cheerio';
import {clean,canonicalUrl} from './domain.mjs';
const normalized=text=>clean(text).normalize('NFKC').toLowerCase();
const months=['january','february','march','april','may','june','july','august','september','october','november','december'];

function scopedDeadline(call,document){
 const scope=call.scope;
 if(!scope?.container||!scope.identitySelector||!scope.identityText?.trim()||!scope.deadlineSelector)throw new Error('call_deadline_scope_missing');
 const $=load(document.body),unavailable='nav,header,footer,aside,[hidden],[aria-hidden="true"],[style*="display:none"],[style*="display: none"]';
 const containers=$(scope.container);
 if(containers.length!==1||containers.closest(unavailable).length)throw new Error('call_deadline_scope_mismatch');
 const identity=containers.find(scope.identitySelector),deadline=containers.find(scope.deadlineSelector);
 if(identity.length!==1||deadline.length!==1||identity.closest(unavailable).length||deadline.closest(unavailable).length)throw new Error('call_deadline_scope_mismatch');
 // Read visible descendants only. An adjacent offer, a hidden deadline or an
 // institute-wide year cannot validate the selected offer's closing sentence.
 const visibleText=node=>{const copy=node.clone();copy.find(unavailable).remove();return normalized(copy.text());};
 if(visibleText(identity)!==normalized(scope.identityText)||!visibleText(deadline).includes(normalized(call.sourceText)))throw new Error('call_deadline_scope_mismatch');
}

function datedCall(call,document){
 const text=normalized(call.sourceText),legacy=text.match(/^deadline:\s*(january|february|march|april|may|june|july|august|september|october|november|december) (\d{1,2}), (\d{4})$/);
 if(legacy)return {month:legacy[1],day:legacy[2],year:legacy[3]};
 // Observed BCAM and IMDEA Software formats. New variants require an explicit
 // local DOM binding between the exact offer identity and its deadline text.
 const match=text.match(/^deadline(?::| for applications is)\s*(january|february|march|april|may|june|july|august|september|october|november|december) (\d{1,2})(st|nd|rd|th)(?:,)? (\d{4})(?:, (\d{2}):(\d{2}) (cet|cest))?\.?$/);
 if(!match)throw new Error('call_deadline_label_missing');
 const day=Number(match[2]),suffix=day%100>=11&&day%100<=13?'th':({1:'st',2:'nd',3:'rd'}[day%10]||'th');
 if(match[3]!==suffix||match[5]&&(Number(match[5])>23||Number(match[6])>59))throw new Error('call_deadline_mismatch');
 scopedDeadline(call,document);
 return {month:match[1],day:match[2],year:match[4],...(match[5]?{clock:true}:{})};
}

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
 const date=datedCall(call,document);
 const iso=date.year+'-'+String(months.indexOf(date.month)+1).padStart(2,'0')+'-'+date.day.padStart(2,'0');
 const timestamp=Date.parse(iso+'T00:00:00Z');
 if(iso!==call.deadline||!Number.isFinite(timestamp)||new Date(timestamp).toISOString().slice(0,10)!==iso)throw new Error('call_deadline_mismatch');
 return {status:'open',deadline:iso,deadlinePrecision:'date',...(date.clock?{deadlineNote:'La fuente indica «'+clean(call.sourceText)+'». Se conserva el día; confirma la hora y zona horaria en la convocatoria.'}:{})};
}
