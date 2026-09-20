export function validateInstitutionRegistry(registry){
 if(!registry.institutions?.length)throw new Error('Refusing to publish an empty institution registry');
 const ids=new Set(),subjects=new Map((registry.research?.subjects||[]).map(subject=>[subject.id,subject]));
 for(const institution of registry.institutions){
  if(!institution.id||ids.has(institution.id)||!institution.name||!institution.country||!Array.isArray(institution.sources)||!institution.researchMetrics||institution._review)throw new Error('Invalid institution registry: '+institution.id);
  ids.add(institution.id);
  for(const [subjectId,metric] of Object.entries(institution.researchMetrics)){
   if(!metric.tier)continue;
   const subject=subjects.get(subjectId);
   const covered=Boolean(subject)&&(institution.geography==='europe'||institution.geography==='ehea-extension'&&subject.countryScope?.includes(institution.country));
   if(!covered||!['T1','T2','T3','T4'].includes(metric.tier)||![metric.volume,metric.impactEligible,metric.impactCoverage].every(Number.isFinite)||metric.volume<50||metric.impactEligible<50||metric.impactCoverage<.8||metric.impactCoverage>1)throw new Error('Invalid research tier: '+institution.id);
  }
 }
}
