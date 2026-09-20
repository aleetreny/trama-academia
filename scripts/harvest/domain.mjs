import { createHash } from 'node:crypto';
export const COUNTRIES = {Armenia:'AM',Azerbaijan:'AZ',Georgia:'GE',Belarus:'BY',Aland:'AX','Faroe Islands':'FO',Guernsey:'GG',Gibraltar:'GI','Isle of Man':'IM',Jersey:'JE','Svalbard and Jan Mayen':'SJ','Holy See':'VA',Austria:'AT',Belgium:'BE',Bulgaria:'BG',Croatia:'HR',Cyprus:'CY','Czech Republic':'CZ',Czechia:'CZ',Denmark:'DK',Estonia:'EE',Finland:'FI',France:'FR',Germany:'DE',Greece:'GR',Hungary:'HU',Iceland:'IS',Ireland:'IE',Italy:'IT',Latvia:'LV',Lithuania:'LT',Luxembourg:'LU',Malta:'MT',Netherlands:'NL',Norway:'NO',Poland:'PL',Portugal:'PT',Romania:'RO',Slovakia:'SK',Slovenia:'SI',Spain:'ES',Sweden:'SE',Switzerland:'CH','United Kingdom':'GB',Albania:'AL','Bosnia and Herzegovina':'BA',Montenegro:'ME','North Macedonia':'MK',Serbia:'RS',Ukraine:'UA',Moldova:'MD',Kosovo:'XK',Liechtenstein:'LI',Monaco:'MC',Andorra:'AD','San Marino':'SM'};
export const clean = (s='') => String(s).replace(/\s+/g,' ').trim();
export const hash = s => createHash('sha256').update(s).digest('hex');
export const idFor = url => hash(canonicalUrl(url)).slice(0,20);
export function canonicalUrl(raw) { const u=new URL(raw);u.hash='';for(const k of [...u.searchParams.keys()])if(k.startsWith('utm_')||['fbclid','gclid','ref'].includes(k))u.searchParams.delete(k);u.searchParams.sort();return u.toString().replace(/\/$/,''); }
export function fieldsFrom(text){
  // Normalise the languages observed in programme catalogues before applying the
  // shared discipline rules. This prevents an English-only admission bias.
  text=String(text).replace(/mathematics applied to/gi,'applied mathematics');
  // Course names observed in the Yildiz graduate curricula, including Turkish
  // dotted I. The teaching language is a separate fact and is never inferred.
  text=String(text).replace(/veri bilimi|veri madenciliği|büyük veri/gi,'data science').replace(/makine öğrenme(?:si|sine)|yapay zeka|derin öğrenme/gi,'machine learning').replace(/[İIıi]statistik/gi,'statistics').replace(/yazılım|hesaplamalı/gi,'computational').replace(/optimizasyon/gi,'optimization');
  text=String(text).replace(/m[eé]todos? num[eé]ricos?/gi,'numerical methods').replace(/optimizaci[oó]n|ottimizzazione/gi,'optimization').replace(/controllo ottimo/gi,'control theory').replace(/ecuaciones en derivadas parciales/gi,'partial differential equations').replace(/teor[ií]a de control/gi,'control theory').replace(/investigaci[oó]n operativa|investiga[cç][aã]o operacional|ricerca operativa/gi,'operations research').replace(/computaci[oó]n/gi,'computing').replace(/computaciona(?:l(?:es)?|is)/gi,'computational').replace(/matematyka stosowana|modelowanie matematyczne/gi,'applied mathematics').replace(/statystyka/gi,'statistics').replace(/informatyka/gi,'informatics').replace(/ciencias? de (?:los )?datos|ci[eê]ncia(?:s)? (?:de |dos )?dados|scienza dei dati|datenwissenschaft/gi,'data science').replace(/inteligencia artificial|intelig[eê]ncia artificial|intelligenza artificiale|k[uü]nstliche intelligenz/gi,'artificial intelligence').replace(/aprendizaje autom[aá]tico|aprendizagem autom[aá]tica|maschinelles lernen/gi,'machine learning').replace(/estad[ií]stica|estat[ií]stica|statistica/gi,'statistics').replace(/inform[aá]tica|informatica|informatik/gi,'informatics').replace(/matem[aá]ticas aplicadas|matem[aá]tica aplicada|matematica applicata|angewandte mathematik/gi,'applied mathematics');
  const rules=[['Machine learning',/machine[ -]learning|deep learning|artificial intelligence|intelligence artificielle|apprentissage|neural network|foundation model|reinforcement learning|federated learning|distributed learning|large language model|\bLLM\b|computer vision|natural language processing|maskinl[æä]ring|kunstig intelligens|artificiell intelligens/i],['Ciencia de datos',/data science|data mining|data analytics|big data|data-driven|science des donn[ée]es|scientific computing|datavitenskap/i],['Estadística',/statistic|statistique|stochastic|probabilistic|bayesian|causal inference|statistikk?|stokastisk/i],['Informática',/computer science|computing|informatics|informatique|algorithm|software|cyber[ -]?security|cybers[ée]curit[ée]|computer graphics|3d reconstruction|human.computer|distributed systems|computational|information theory|data structures|database|informatikk?|datavetenskap|datalogi|algoritm/i],['Matemáticas aplicadas',/applied math|math[ée]matiques appliqu[ée]es|numerical|optimization|optimisation|inverse problem|partial differential|mathematical model|operations research|control theory|anvendt matematikk?|till[äa]mpad matematik|optimalisering|numerisk/i]];
  return rules.filter(([,re])=>re.test(text)).map(([name])=>name);
}
export function stageFrom(title,profile='',qualification=''){
  if(/research engineer|ing[ée]nieur/i.test(title)&&/PhD|Doctoral|doctorat/i.test(qualification))return 'postdoc';
  if(/post.?doc|postdoctoral|postdoktor/i.test(title))return 'postdoc';
  if(/professor|lecturer|tenure|faculty|group leader|chair |ma[iî]tre de conf|charg[ée].? de recherche|directeur de recherche|f[øö]rsteamanuensis|universitetslektor|universitetsadjunkt|dosent/i.test(title))return 'faculty';
  if(/ph\.?d|doctoral|doctorant|doctorate|studentship|doktorand|predoctoral|stipendiat/i.test(title))return 'doctorado';
  if(/research fellow|research associate/i.test(title))return 'postdoc';
  if(/research(?:er| scientist)|forskare|forsker/i.test(title)&&/Ph\.?D|doctoral degree|doctorate|doktorgrad/i.test(qualification))return 'postdoc';
  if(/\bintern(?:ship)?s?\b|research assistant|student assistant|research engineer|ing[ée]nieur|stage |stagiaire|wissenschaftliche.*hilf|master[’']?s? thesis|forskningsassistent/i.test(title))return 'grado';
  if(/R2/.test(profile)&&/PhD|Doctoral/.test(qualification))return 'postdoc';
  return null;
}
export function effectiveStatus(record,now=Date.now()){
  if(record.status==='closed')return 'closed';
  if(record.deadline && Date.parse(record.deadline.length===10?record.deadline+'T23:59:59Z':record.deadline)<now)return 'closed';
  if(record.lastError)return 'unverified';
  if(record.kind==='programme'||record.kind==='funding-programme')return 'programme';
  if(!record.verifiedAt||now-Date.parse(record.verifiedAt)>14*86400000)return 'unverified';
  if(record.deadline)return 'open';
  return ['rolling','listed'].includes(record.status)?record.status:'unverified';
}
export function entryLevel(text){
  const s=clean(text);if(/PhD|Ph\.D|Doctoral degree|doctorat|doctorate|doktorgrad/i.test(s))return 'Doctorado';
  if(/Master|MSc|bac\s?\+\s?5|5.year university degree/i.test(s))return 'Máster';
  if(/Bachelor|BSc|Licence|bac\s?\+\s?3/i.test(s))return 'Grado';
  if(/undergraduate|enrolled.*student/i.test(s))return 'Estudiante de grado';return 'Consultar requisitos';
}
export function requiredDegree(text){
 const s=clean(text);const match=s.match(/(?:(?:must|should|will|shall|need to)\s+(?:have|hold|possess)\s+|requirements?\s*:?\s*|you have\s+|hold\s+)(?:(?:completed|obtained|a|an|their|your|relevant|applicable|equivalent|foreign|at least)\s+)*(?:Ph\.?D|doctoral degree|doctorate|master[’']?s?|bachelor[’']?s?|MSc|BSc)(?:\s+degree)?/i);
 return match?entryLevel(match[0]):'Consultar requisitos';
}
export function durationFrom(text){
 const match=clean(text).match(/(?:fixed.term contract\s*:\s*|employment for\s+|contract (?:of|for)\s+|duration (?:of|:)\s*)(?:a |an )?((?:\d+(?:\.\d+)?|one|two|three|four|five|six)\s*(?:years?|months?))/i);
 return match?.[1]||null;
}

// Preserve the source currency and pay period; never derive take-home pay.
export function salaryFromText(text){
  const match=clean(text).match(/(?:€|EUR)\s*(\d[\d\s.,]*\d|\d)|(?<!\d)(\d[\d\s.,]*\d|\d)\s*(?:€|EUR)/i);
  let raw=(match?.[1]||match?.[2]||'').replace(/\s/g,'');
  if(/^\d{1,3}(?:[.,]\d{3})+$/.test(raw))raw=raw.replace(/[.,]/g,'');
  else if(raw.includes('.')&&raw.includes(',')){const decimal=raw.lastIndexOf('.')>raw.lastIndexOf(',')?'.':',';raw=raw.replace(decimal==='.'?/,/g:/\./g,'').replace(',','.');}
  else raw=raw.replace(',','.');
  const amount=raw&&Number.isFinite(Number(raw))?Number(raw):null;
  return {kind:'salary',text:clean(text).slice(0,180),amount,currency:match?'EUR':null,period:/month|mensuel/i.test(text)?'month':/annual|annuel|year/i.test(text)?'year':null,gross:/gross|brut/i.test(text)};
}
