import fs from 'node:fs/promises';
import {getPage,persistObservations} from './http.mjs';
import {effectiveStatus} from './domain.mjs';
import {parseInria,parseEuraxess,parseJobPosting} from './adapters.mjs';
import {parseEth} from './extra-adapters.mjs';
const data=JSON.parse(await fs.readFile('data/catalogue.json','utf8'));
const sources=new Map(data.sources.map(s=>[s.id,s]));
const counts={checked:0,closed:0,failed:0};
// Discovery cannot prove closure. Recheck known pages omitted from the latest successful crawl.
let next=0;
async function worker(){while(next<data.records.length){const old=data.records[next++];old.status=effectiveStatus(old);if(old.kind!=='position'||old.status==='closed'||Date.now()-Date.parse(old.verifiedAt||0)<6*3600000)continue;
 const source=sources.get(old.sourceId);const parse={inria:parseInria,euraxess:parseEuraxess,'sitemap-jobposting':parseJobPosting,jobsacuk:parseJobPosting,eth:parseEth}[source?.adapter];if(!parse)continue;
 try{const page=await getPage(old.url);const fresh=parse(page.body,old.url,source,page,{institution:old.institution});if(!fresh)throw new Error('known_offer_parse_failed');Object.assign(old,fresh,{lastError:null});counts.checked++;}
 catch(e){if(['http_404','http_410'].includes(e.message)){old.status='closed';old.closedAt=new Date().toISOString();counts.closed++;}else{old.lastError=e.message;old.lastAttemptAt=new Date().toISOString();old.status=effectiveStatus(old);counts.failed++;}}
}}
await Promise.all([worker(),worker(),worker()]);
await fs.writeFile('data/catalogue.json.tmp',JSON.stringify(data,null,2)+'\n');await fs.rename('data/catalogue.json.tmp','data/catalogue.json');await persistObservations();console.log(JSON.stringify(counts));
