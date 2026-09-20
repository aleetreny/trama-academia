import {COUNTRIES,clean} from './domain.mjs';

const countryScope=new Set([...Object.values(COUNTRIES),'EU']);
const transcontinental=new Set(['RU','TR','KZ']);
const literal=text=>clean(text).normalize('NFKC').replace(/[’‘]/g,"'").replace(/[–—−]/g,'-').toLowerCase();
const place=text=>literal(text).normalize('NFD').replace(/\p{M}/gu,'').replace(/ı/g,'i');

// Reviewed areas, not a country-wide exemption. New areas need geographic review.
// Istanbul alone is insufficient: the programme's unit must have an address in
// one of the reviewed European districts/campuses. Tuzla is deliberately absent.
const areas={
 'ru-moscow':{country:'RU',pattern:/\bmoscow\b|москв[аеы](?:$|[^\p{L}])/u},
 'ru-st-petersburg':{country:'RU',pattern:/\b(?:st\.?|saint)[ -]+petersburg\b|санкт[ -]петербург/u},
 'tr-istanbul-europe':{country:'TR',pattern:/\b(?:ayazaga|sariyer|maslak|macka|taskisla|beyoglu|gumussuyu|davutpasa|esenler|besiktas|rumeli hisari|kilyos)\b/u},
};

export function assertProgrammeGeography(seed){
 if(countryScope.has(seed.country))return null;
 if(!transcontinental.has(seed.country))throw new Error('non_european_destination');
 const g=seed.geography,area=areas[g?.areaId];
 if(seed.kind!=='programme'||g?.scope!=='european-campus'||!area||area.country!==seed.country)throw new Error('european_campus_review_required');
 if(!g.campus?.trim()||!g.city?.trim()||!Array.isArray(g.evidenceUrls)||!g.evidenceUrls.length||new Set(g.evidenceUrls).size!==g.evidenceUrls.length)throw new Error('campus_metadata_missing');
 const academicUrls=[seed.primaryEvidenceUrl||seed.url,seed.researchEvidenceUrl].filter(Boolean);
 if(!academicUrls.includes(g.programmeEvidenceUrl))throw new Error('programme_campus_association_missing');
 const association=(seed.evidenceChecks||[]).filter(c=>c.field==='campus-programme'&&(c.url||academicUrls[0])===g.programmeEvidenceUrl&&c.phrases?.some(p=>p.trim()));
 if(!association.length)throw new Error('programme_campus_association_missing');
 for(const url of g.evidenceUrls){
  const checks=(seed.evidenceChecks||[]).filter(c=>c.field==='campus'&&(c.url||academicUrls[0])===url);
  if(!checks.some(c=>c.phrases?.some(p=>area.pattern.test(place(p)))))throw new Error('european_campus_location_missing');
 }
 return area;
}

// Called after the normal literal checks. Keep the actual checked texts and
// hashes so audit and database publication can reject a bare geographic label.
export function verifyProgrammeGeography(seed,documents){
 const area=assertProgrammeGeography(seed);
 if(!area)return null;
 const g=seed.geography,primaryUrl=seed.primaryEvidenceUrl||seed.url;
 const readChecks=(url,field)=>{
  const document=documents.get(url);
  if(!document)throw new Error('campus_evidence_source_missing');
  const phrases=(seed.evidenceChecks||[]).filter(c=>c.field===field&&(c.url||primaryUrl)===url).flatMap(c=>c.phrases||[]);
  if(!phrases.length||phrases.some(p=>!p.trim()||!literal(document.text).includes(literal(p))))throw new Error('campus_evidence_changed');
  return {requestedUrl:url,url:document.finalUrl,checkedAt:document.checkedAt,contentHash:document.hash,phrases};
 };
 return {
  method:'official-programme-campus',areaId:g.areaId,scope:g.scope,country:seed.country,campus:g.campus,city:g.city,
  programme:readChecks(g.programmeEvidenceUrl,'campus-programme'),
  locations:g.evidenceUrls.map(url=>readChecks(url,'campus')),
 };
}

export function isEuropeanDestination(record){
 if(countryScope.has(record.country))return true;
 const g=record.geography,proof=record.evidence?.geography,area=areas[g?.areaId];
 if(!transcontinental.has(record.country)||record.kind!=='programme'||!area||area.country!==record.country||g?.scope!=='european-campus')return false;
 if(!g.campus?.trim()||!g.city?.trim()||record.city!==g.city||!Array.isArray(g.evidenceUrls)||!g.evidenceUrls.length||new Set(g.evidenceUrls).size!==g.evidenceUrls.length)return false;
 if(proof?.method!=='official-programme-campus'||proof.areaId!==g.areaId||proof.scope!==g.scope||proof.country!==record.country||proof.campus!==g.campus||proof.city!==g.city)return false;
 const references=record.evidence.references||[];
 const witnessed=p=>p?.url&&p.contentHash&&Number.isFinite(Date.parse(p.checkedAt))&&p.phrases?.length&&p.phrases.every(s=>typeof s==='string'&&s.trim())&&references.some(r=>r.url===p.url&&r.contentHash===p.contentHash&&r.checkedAt===p.checkedAt);
 if(!witnessed(proof.programme)||proof.programme.requestedUrl!==g.programmeEvidenceUrl||![record.evidence.checkedUrl,record.evidence.researchUrl].includes(proof.programme.url))return false;
 if(!Array.isArray(proof.locations)||proof.locations.length!==g.evidenceUrls.length)return false;
 return g.evidenceUrls.every(url=>proof.locations.some(p=>p.requestedUrl===url&&witnessed(p)&&p.phrases.some(s=>area.pattern.test(place(s)))));
}
