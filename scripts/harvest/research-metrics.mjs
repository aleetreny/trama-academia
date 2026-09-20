import fs from 'node:fs/promises';
import {openAlex,allGroups} from './openalex-client.mjs';
import {collectIdentities} from './openalex-identities.mjs';
import {retainCompletedSubjects} from './research-edition.mjs';
import {EUROPE_CODES,ACADEMIC_EXTENSION_CODES,TRANSCONTINENTAL_CODES} from './institution-universe.mjs';

const positional=process.argv.slice(2).filter(arg=>!arg.startsWith('--'));
const universeFile=positional[0]||'work/ror/universe.json';
const output=positional[1]||'work/openalex/indicators.json';
const selected=process.argv.find(arg=>arg.startsWith('--subjects='))?.slice(11).split(',');
const universe=JSON.parse(await fs.readFile(universeFile,'utf8'));
const identityFile='work/openalex/identities.json';
let snapshot;try{snapshot=JSON.parse(await fs.readFile(identityFile,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const {directory,references}=await collectIdentities(universe.institutions.map(x=>x.ror),{snapshot,fetchPage:openAlex,onBatch:progress=>console.log(JSON.stringify({phase:'identity',...progress}))});
await fs.mkdir('work/openalex',{recursive:true});
await fs.writeFile(identityFile+'.tmp',JSON.stringify({directory,references},null,2));await fs.rename(identityFile+'.tmp',identityFile);
const subjects=[
 {id:'cs',name:'Informática',filter:'primary_topic.field.id:17',taxonomy:['https://openalex.org/fields/17']},
 {id:'ml',name:'IA y aprendizaje automático',filter:'primary_topic.subfield.id:1702|1707',taxonomy:['https://openalex.org/subfields/1702','https://openalex.org/subfields/1707']},
 {id:'statistics',name:'Estadística y probabilidad',filter:'primary_topic.subfield.id:2613|1804',taxonomy:['https://openalex.org/subfields/2613','https://openalex.org/subfields/1804']},
 {id:'applied-math',name:'Matemáticas aplicadas',filter:'primary_topic.subfield.id:2604',taxonomy:['https://openalex.org/subfields/2604']}
];
if(selected?.some(id=>!subjects.some(subject=>subject.id===id)))throw new Error('unknown_research_subject');
let previous;try{previous=JSON.parse(await fs.readFile(output,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const retained=retainCompletedSubjects(previous,subjects);
const data={generatedAt:new Date().toISOString(),provider:'OpenAlex',license:'CC0-1.0',status:'in_progress',workTypes:['article','conference-paper','data-paper','software-paper'],universeProvenance:universe.provenance,identityCount:Object.keys(directory).length,subjects:retained};
const countryScope=[...EUROPE_CODES,...ACADEMIC_EXTENSION_CODES,...TRANSCONTINENTAL_CODES];
const countries=countryScope.join('|');
for(const subject of subjects){
 if(selected&&!selected.includes(subject.id))continue;
 const metrics={};
 const base=subject.filter+',is_retracted:false,authorships.institutions.country_code:'+countries;
 // Recent activity and citation impact use different, explicit windows. The impact
 // window has three full calendar years for citations even for its most recent publication year.
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
 data.subjects=data.subjects.filter(old=>old.id!==subject.id);data.subjects.push({...subject,countryScope,metrics});
 data.generatedAt=new Date().toISOString();data.status=data.subjects.length===subjects.length?'complete':'in_progress';
 await fs.writeFile(output+'.tmp',JSON.stringify(data));await fs.rename(output+'.tmp',output);
}
console.log(JSON.stringify({complete:data.status==='complete',subjects:data.subjects.length,identityCount:data.identityCount,output}));
