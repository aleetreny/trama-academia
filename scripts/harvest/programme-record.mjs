import {load} from 'cheerio';
import {getPage} from './http.mjs';
import {clean,idFor,fieldsFrom,canonicalUrl} from './domain.mjs';
import {programmeText,hasResearchComponent} from './programme-evidence.mjs';
import {extractPdfText} from './pdf.mjs';
import {nuxtProgrammeText} from './nuxt-programme.mjs';
import {assertProgrammeGeography,verifyProgrammeGeography} from './programme-geography.mjs';

const FIELDS=['Ciencia de datos','Machine learning','Estadística','Informática','Matemáticas aplicadas'];
const normalized=text=>clean(text).normalize('NFKC').replace(/[’‘]/g,"'").replace(/[–—−]/g,'-').toLowerCase();

// Detailed editorial facts remain verified only while their supporting text exists.
// A failed check is handled by the runner without overwriting the last good record.
export async function verifyProgramme(seed,fetchPage=getPage){
 if(!['grado','master','doctorado','postdoc','faculty'].includes(seed.stage))throw new Error('invalid_programme_stage');
 assertProgrammeGeography(seed);
 const documents=new Map();
 const references=new Map();
 const primaryUrl=seed.primaryEvidenceUrl||seed.url;
 if(seed.primaryEvidenceUrl&&!seed.evidencePages?.some(p=>p.url===primaryUrl))throw new Error('primary_evidence_must_be_declared');
 for(const reference of [{url:primaryUrl,label:seed.primaryEvidenceUrl?'Registro oficial del programa':'Información del programa'},...(seed.researchEvidenceUrl?[{url:seed.researchEvidenceUrl,label:'Plan y trabajo de investigación'}]:[]),...(seed.evidencePages||[])]){
  // Supporting metadata must survive when the same document is the research
  // reference. Otherwise an explicitly declared PDF is accidentally read as HTML.
  references.set(reference.url,{...references.get(reference.url),...reference});
 }
 for(const reference of references.values()){
  const isPdf=reference.format==='pdf';
  const page=await fetchPage(reference.url,isPdf?{format:'pdf'}:{});
  if(reference.pages&&!isPdf)throw new Error('page_selection_requires_pdf');
  const text=isPdf?clean(await extractPdfText(page,{pages:reference.pages})):reference.format==='nuxt-programme'?nuxtProgrammeText(page.body,page.finalUrl,reference.programmeId):programmeText(page.body);
  const heading=isPdf?'':clean(load(page.body)('h1').text());
  if(/page not found|404 not found|page introuvable/i.test(heading)||text.length<200||/verify that you.re not a robot|javascript is disabled|enable javascript and then reload/i.test(text.slice(0,500)))throw new Error('content_missing: '+reference.url);
  // Supporting pages may omit an editorial label. Keep the official heading
  // visible instead of stringifying an absent label as "undefined".
  const suppliedLabel=typeof reference.label==='string'?clean(reference.label):'';
  const label=suppliedLabel&&!/^(undefined|null)$/i.test(suppliedLabel)?suppliedLabel:heading||('Documento oficial'+(isPdf?' en PDF':'')+' · '+new URL(page.finalUrl).hostname);
  documents.set(reference.url,{...page,text,label,...(reference.pages?{pages:reference.pages}:{})});
 }
 const primary=documents.get(primaryUrl);
 const research=documents.get(seed.researchEvidenceUrl||primaryUrl);
 const observedFields=fieldsFrom([...documents.values()].map(p=>p.text).join(' '));
 const fields=seed.fields|| (seed.kind.includes('funding')?FIELDS:fieldsFrom(seed.title+' '+primary.text.slice(0,5000)).filter(field=>observedFields.includes(field)));
 if(!fields.length||fields.some(f=>!FIELDS.includes(f)))throw new Error('discipline_unverified');
 if(seed.fields&&!seed.kind.includes('funding')&&fields.some(f=>!observedFields.includes(f)))throw new Error('discipline_unverified');
 if(seed.stage==='master'&&seed.kind==='programme'&&!hasResearchComponent(research.text))throw new Error('research_component_unverified');
 for(const check of seed.evidenceChecks||[]){
  const document=documents.get(check.url||primaryUrl);
  if(!document)throw new Error('evidence_source_missing: '+check.field);
  if(!check.phrases?.length&&!check.links?.length&&!check.labelledValues?.length)throw new Error('evidence_check_empty: '+check.field);
  if(check.phrases?.some(phrase=>!phrase.trim()||!normalized(document.text).includes(normalized(phrase))))throw new Error('evidence_changed: '+check.field);
  if(check.links?.length){
   const $=load(document.body),links=new Set();
   $('a[href]').each((_,element)=>{try{links.add(canonicalUrl(new URL($(element).attr('href'),document.finalUrl).href));}catch{}});
   if(check.links.some(url=>!links.has(canonicalUrl(url))))throw new Error('evidence_link_changed: '+check.field);
  }
  if(check.labelledValues?.length){
   const $=load(document.body);
   for(const value of check.labelledValues){
    if(!value.container||!value.labelSelector||!value.valueSelector||!value.label?.trim()||!value.value?.trim())throw new Error('evidence_value_check_invalid: '+check.field);
    const matches=$(value.container).filter((_,element)=>!$(element).closest('nav,header,footer,[hidden],[aria-hidden="true"]').length&&normalized($(element).find(value.labelSelector).text())===normalized(value.label));
    // Preserve the value's DOM boundary. Plain text can join score 50 to the
    // following heading 2 and falsely produce a minimum score of 502.
    if(matches.length!==1||normalized(matches.find(value.valueSelector).text())!==normalized(value.value))throw new Error('evidence_value_changed: '+check.field);
   }
  }
 }
 const checkedAt=[...documents.values()].map(p=>p.checkedAt).sort()[0];
 const geographyEvidence=verifyProgrammeGeography(seed,documents);
 const record={...seed,id:idFor(seed.url),applyUrl:seed.url,sourceId:'programme-'+idFor(seed.url),sourceName:seed.institution,status:'programme',verifiedAt:checkedAt,seenAt:primary.checkedAt,deadline:null,deadlinePrecision:null,fields,funding:seed.funding||{kind:seed.kind.includes('funding')?'scholarship':'unconfirmed',text:seed.kind.includes('funding')?'Ayuda competitiva; consultar importe':'Financiación no garantizada'},duration:seed.duration||null,languages:seed.languages||[],contract:seed.contract||null,programmeType:seed.programmeType||(seed.kind.includes('funding')?'Programa de financiación':seed.stage==='master'?'Máster con componente de investigación':seed.stage==='grado'?'Estancia de investigación':'Programa doctoral'),researchNote:seed.researchNote||(seed.stage==='master'?'La información académica enlazada documenta una tesis, proyecto o formación orientada a investigación. Revisa el plan y la supervisión antes de decidir.':undefined),lastError:null,evidence:{contentHash:primary.hash,checkedUrl:primary.finalUrl,method:'official-programme-page',researchUrl:research.finalUrl,references:[...documents.values()].map(p=>({url:p.finalUrl,label:p.label+(p.pages?' · págs. '+p.pages.join(', '):''),checkedAt:p.checkedAt,contentHash:p.hash,...(p.pages?{pages:p.pages}:{})})),checks:(seed.evidenceChecks||[]).map(c=>c.field)}};
 if(seed.primaryEvidenceUrl)record.evidence.method='official-programme-registry';
 else if(references.get(primaryUrl).format==='nuxt-programme')record.evidence.method='official-programme-embedded-data';
 if(geographyEvidence){record.city=seed.geography.city;record.evidence.geography=geographyEvidence;}
 delete record.primaryEvidenceUrl;delete record.researchEvidenceUrl;delete record.evidencePages;delete record.evidenceChecks;
 return record;
}

export function mergeProgrammeRecords(previous,records,reports){
 const merged=new Map(previous.map(r=>[r.id,r]));
 for(const r of records)merged.set(r.id,r);
 for(const report of reports.filter(r=>r.status==='partial')){
  for(const old of merged.values())if(old.sourceId===report.id)merged.set(old.id,{...old,lastError:report.report.errors[0].error,status:'unverified'});
 }
 return [...merged.values()];
}
