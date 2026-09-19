import fs from 'node:fs/promises';
import {openAlex,allGroups} from './openalex-client.mjs';
import {EUROPE_CODES,ACADEMIC_EXTENSION_CODES,TRANSCONTINENTAL_CODES} from './institution-universe.mjs';

const universeFile=process.argv[2]||'work/ror/universe.json';
const output=process.argv[3]||'work/openalex/indicators.json';
const universe=JSON.parse(await fs.readFile(universeFile,'utf8'));
const directory={};const references=[];
for(let start=0;start<universe.institutions.length;start+=100){
 const batch=universe.institutions.slice(start,start+100);
 const response=await openAlex('/institutions',{filter:'ror:'+batch.map(x=>x.ror).join('|'),per_page:100,select:'id,ror,display_name,country_code,type,geo'});
 if(response.body.meta.count>100)throw new Error('ambiguous_ror_batch');
 for(const row of response.body.results){if(directory[row.ror]&&directory[row.ror].id!==row.id)throw new Error('ambiguous_ror');directory[row.ror]=row;}
 references.push({url:response.url,checkedAt:response.checkedAt});
 if(start%1000===0)console.log(JSON.stringify({phase:'identity',processed:Math.min(start+100,universe.institutions.length),matched:Object.keys(directory).length,remaining:response.remaining}));
}
await fs.writeFile('work/openalex/identities.json',JSON.stringify({directory,references},null,2));
const subjects=[
 {id:'cs',name:'Informática',filter:'primary_topic.field.id:17',taxonomy:['https://openalex.org/fields/17']},
 {id:'ml',name:'IA y aprendizaje automático',filter:'primary_topic.subfield.id:1702|1707',taxonomy:['https://openalex.org/subfields/1702','https://openalex.org/subfields/1707']},
 {id:'statistics',name:'Estadística y probabilidad',filter:'primary_topic.subfield.id:2613|1804',taxonomy:['https://openalex.org/subfields/2613','https://openalex.org/subfields/1804']},
 {id:'applied-math',name:'Matemáticas aplicadas',filter:'primary_topic.subfield.id:2604',taxonomy:['https://openalex.org/subfields/2604']}
];
const data={generatedAt:new Date().toISOString(),provider:'OpenAlex',license:'CC0-1.0',status:'in_progress',workTypes:['article','conference-paper','data-paper','software-paper'],universeProvenance:universe.provenance,identityCount:Object.keys(directory).length,subjects:[]};
const countryScope=[...EUROPE_CODES,...ACADEMIC_EXTENSION_CODES,...TRANSCONTINENTAL_CODES];
const countries=countryScope.join('|');
for(const subject of subjects){
 const metrics={};
 const base=subject.filter+',is_retracted:false,authorships.institutions.country_code:'+countries;
 // Recent activity and citation impact use different, explicit windows. The impact
 // window has four full citation years even for its most recent publication year.
 for(const [metric,filter] of Object.entries({volume:base+',publication_year:2020-2024',impactTotal:base+',publication_year:2020-2022',impactEligible:base+',publication_year:2020-2022,citation_normalized_percentile.value:0-1',top10:base+',publication_year:2020-2022,citation_normalized_percentile.is_in_top_10_percent:true'})){
  const subsets=[];
  for(const type of ['article','conference-paper|data-paper|software-paper']){
   // Retain the canonical spelling of earlier journal queries so their checked
   // pages can be reused. The types are disjoint, so counts can be added exactly.
   const typed=filter.replace(',is_retracted:false',',type:'+type+',is_retracted:false');
   subsets.push(await allGroups(typed,{onPage:p=>{if(p.pages%20===0)console.log(JSON.stringify({subject:subject.id,metric,type,...p}));}}));
  }
  const combined=new Map();for(const subset of subsets)for(const row of subset.groups){const old=combined.get(row.key);combined.set(row.key,{...row,count:row.count+(old?.count||0)});}
  metrics[metric]={complete:true,groups:[...combined.values()],references:subsets.flatMap(x=>x.references)};
  console.log(JSON.stringify({subject:subject.id,metric,complete:true,pages:metrics[metric].references.length,groups:metrics[metric].groups.length}));
  await fs.mkdir('work/openalex/groups',{recursive:true});
  await fs.writeFile('work/openalex/groups/'+subject.id+'-'+metric+'.json',JSON.stringify(metrics[metric]));
 }
 data.subjects.push({...subject,countryScope,metrics});
 await fs.writeFile(output,JSON.stringify(data));
}
data.status='complete';data.generatedAt=new Date().toISOString();await fs.writeFile(output,JSON.stringify(data));
console.log(JSON.stringify({complete:true,subjects:data.subjects.length,identityCount:data.identityCount,output}));
