// These are explicit editorial indicators, not an official ranking or a measure
// of supervision quality. Missing or small samples never receive a low tier.
export function wilsonLower(successes,total){
 if(!Number.isFinite(total)||total<=0||successes<0||successes>total)return null;
 const z=1.96,p=successes/total;
 return (p+z*z/(2*total)-z*Math.sqrt((p*(1-p)+z*z/(4*total))/total))/(1+z*z/total);
}
export function midrank(value,values){
 if(!values.length)return null;
 return 100*(values.filter(x=>x<value).length+values.filter(x=>x===value).length/2)/values.length;
}
export function computeTiers(institutions,subject,directory){
 if(Object.values(subject.metrics).some(m=>m.complete!==true))throw new Error('incomplete_metric_crawl');
 const maps=Object.fromEntries(Object.entries(subject.metrics).map(([k,v])=>[k,new Map(v.groups.map(g=>[g.key,g.count]))]));
 const rows=institutions.map(i=>{
  const identity=directory[i.ror],id=identity?.id;
  const value={institutionId:i.id,openalexId:id||null,volume:id?(maps.volume.get(id)||0):null,impactTotal:id?(maps.impactTotal.get(id)||0):null,impactEligible:id?(maps.impactEligible.get(id)||0):null,top10:id?(maps.top10.get(id)||0):null,tier:null,reason:null};
  if(id&&(value.top10>value.impactEligible||value.impactEligible>value.impactTotal))throw new Error('inconsistent_citation_counts: '+id);
  value.impactCoverage=value.impactTotal?value.impactEligible/value.impactTotal:null;
  value.top10Share=value.impactEligible?value.top10/value.impactEligible:null;
  value.impactLower=wilsonLower(value.top10,value.impactEligible);
  if(!id)value.reason='identity-unmatched';
  else if(i.geography==='ehea-extension'&&!subject.countryScope?.includes(i.country))value.reason='scope-pending';
  else if(!['europe','ehea-extension'].includes(i.geography))value.reason='geography-pending';
  else if(value.volume<50||value.impactEligible<50)value.reason='small-sample';
  else if(value.impactCoverage<0.8)value.reason='citation-coverage';
  if(value.reason==='scope-pending')for(const key of ['volume','impactTotal','impactEligible','top10','impactCoverage','top10Share','impactLower'])value[key]=null;
  return value;
 });
 const eligible=rows.filter(x=>x.reason===null);
 const volumes=eligible.map(x=>x.volume),impacts=eligible.map(x=>x.impactLower);
 for(const row of eligible)row.score=(midrank(row.volume,volumes)+midrank(row.impactLower,impacts))/2;
 const scores=eligible.map(x=>x.score);
 for(const row of eligible){
  row.percentile=midrank(row.score,scores);row.cohortSize=eligible.length;
  if(eligible.length<20){row.reason='small-cohort';continue;}
  row.tier=row.percentile>=90?'T1':row.percentile>=75?'T2':row.percentile>=50?'T3':'T4';
 }
 return rows;
}
