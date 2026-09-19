export const normalizeInstitutionText=s=>String(s).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
export const institutionSearchText=i=>normalizeInstitutionText([i.name,...i.aliases,i.city||''].join(' '));
export const institutionPriority=i=>i.sources.length>0||Object.values(i.researchMetrics).some(m=>(m.volume||0)>=20);
export function institutionMetadata(registry){
 const {institutions,...metadata}=registry,countries={};let withSources=0,withCheckedSources=0;
 for(const i of institutions){
  const country=countries[i.country]||{total:0,withSources:0,withCheckedSources:0};country.total++;
  if(i.sources.length){withSources++;country.withSources++;}
  if(i.sources.some(x=>x.status==='checked')){withCheckedSources++;country.withCheckedSources++;}
  countries[i.country]=country;
 }
 return {...metadata,summary:{total:institutions.length,withSources,withCheckedSources,countriesWithSources:Object.values(countries).filter(x=>x.withSources).length,countries}};
}
