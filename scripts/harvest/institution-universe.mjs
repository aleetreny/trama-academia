import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

// A registry entry is a discovery candidate, not evidence of a programme or a vacancy.
export const EUROPE_CODES='AD AL AT AX BA BE BG BY CH CY CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS SE SI SJ SK SM UA VA XK'.split(' ');
export const ACADEMIC_EXTENSION_CODES=['AM','AZ','GE'];
export const TRANSCONTINENTAL_CODES=['RU','TR','KZ'];
export const institutionGeography=country=>ACADEMIC_EXTENSION_CODES.includes(country)?'ehea-extension':EUROPE_CODES.includes(country)?'europe':'campus-review';
export function buildUniverse(records,release){
 const institutions=[];
 for(const r of records){
  if(r.status!=='active'||!r.types.includes('education'))continue;
  const locations=r.locations.map(x=>x.geonames_details);
  const g=locations.find(x=>EUROPE_CODES.includes(x.country_code))||locations.find(x=>ACADEMIC_EXTENSION_CODES.includes(x.country_code))||locations.find(x=>TRANSCONTINENTAL_CODES.includes(x.country_code));
  if(!g)continue;
  const primary=r.names.find(x=>x.types.includes('ror_display'))||r.names[0];
  institutions.push({id:r.id.split('/').at(-1),ror:r.id,name:primary.value,aliases:[...new Set(r.names.map(x=>x.value))].filter(x=>x!==primary.value),country:g.country_code,city:g.name,coordinates:{lat:g.lat,lng:g.lng},officialUrl:r.links.find(x=>x.type==='website')?.value||null,domains:r.domains||[],types:r.types,geography:institutionGeography(g.country_code),reviewStatus:'candidate',sources:[],researchMetrics:{},provenance:{source:'ROR',release:release.doi}});
 }
 return {generatedAt:new Date().toISOString(),provenance:{source:'Research Organization Registry',url:'https://doi.org/'+release.doi,releaseDate:release.metadata.publication_date,version:release.files[0].key,checksum:release.files[0].checksum,license:'CC0-1.0'},scope:{countries:[...EUROPE_CODES,...ACADEMIC_EXTENSION_CODES],academicExtension:ACADEMIC_EXTENSION_CODES,academicExtensionSource:'https://ehea.info/about-ehea/ehea-membership-and-criteria/',transcontinental:TRANSCONTINENTAL_CODES,rule:'Active ROR education organisations in the listed European countries and territories, plus Armenia, Azerbaijan and Georgia as an explicitly labelled EHEA academic extension. Russian, Turkish and Kazakh entries require campus geography review. ROR is not a complete register of degree-granting institutions or an assessment of subject relevance.'},institutions:institutions.sort((a,b)=>a.country.localeCompare(b.country)||a.name.localeCompare(b.name))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [recordsFile,releaseFile,output='data/institution-universe.json']=process.argv.slice(2);
 if(!recordsFile||!releaseFile)throw new Error('Usage: node scripts/harvest/institution-universe.mjs RECORDS_JSON RELEASE_JSON [OUTPUT]');
 const result=buildUniverse(JSON.parse(await fs.readFile(recordsFile,'utf8')),JSON.parse(await fs.readFile(releaseFile,'utf8')));
 await fs.writeFile(output,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({institutions:result.institutions.length,geography:Object.fromEntries(['europe','ehea-extension','campus-review'].map(x=>[x,result.institutions.filter(i=>i.geography===x).length])),countries:[...new Set(result.institutions.map(x=>x.country))].length,output}));
}
