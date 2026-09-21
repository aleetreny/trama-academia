import {clean} from './domain.mjs';
const normalized=text=>clean(text).normalize('NFKC').toLowerCase();
const months=['january','february','march','april','may','june','july','august','september','october','november','december'];

// A reviewed vacancy needs its own witnessed closing date or explicit rolling
// statement. Degree pages never become open vacancies because of intake dates.
export function reviewedCallStatus(seed,documents){
 if(seed.kind!=='position'){
  if(seed.call!==undefined)throw new Error('call_requires_position');
  return {status:'programme',deadline:null,deadlinePrecision:null};
 }
 const call=seed.call,document=documents.get(call?.sourceUrl||seed.url);
 if(!call?.sourceText?.trim()||!document||!normalized(document.text).includes(normalized(call.sourceText)))throw new Error('call_evidence_missing');
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
