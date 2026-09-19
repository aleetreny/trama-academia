import fs from 'node:fs/promises';
import {getPage,persistObservations} from './http.mjs';
import {effectiveStatus} from './domain.mjs';
import {parseInria,parseEuraxess,parseJobPosting} from './adapters.mjs';
import {parseEth} from './extra-adapters.mjs';
import {parseKth,parseAalto,parseUppsala,parseHelsinki} from './nordic-adapters.mjs';
import {JOBBNORGE_FEED,parseJobbnorgeFeed,parseJobbnorge} from './jobbnorge.mjs';
const data=JSON.parse(await fs.readFile('data/catalogue.json','utf8'));
const sources=new Map(data.sources.map(s=>[s.id,s]));
const counts={checked:0,closed:0,failed:0};
let jobbnorgeFeed;
// Discovery cannot prove closure. Recheck known pages omitted from the latest successful crawl.
let next=0;
async function worker(){while(next<data.records.length){const old=data.records[next++];old.status=effectiveStatus(old);if(old.kind!=='position'||old.status==='closed'||Date.now()-Date.parse(old.verifiedAt||0)<6*3600000)continue;
 const source=sources.get(old.sourceId);const parse={inria:parseInria,euraxess:parseEuraxess,'sitemap-jobposting':parseJobPosting,jobsacuk:parseJobPosting,eth:parseEth,kth:parseKth,aalto:parseAalto,uppsala:parseUppsala,helsinki:parseHelsinki}[source?.adapter];if(!parse&&source?.adapter!=='jobbnorge')continue;
 try{let fresh;if(source.adapter==='jobbnorge'){
  jobbnorgeFeed??=getPage(JOBBNORGE_FEED).then(page=>({page,jobs:parseJobbnorgeFeed(page.body)}));
  const {page,jobs}=await jobbnorgeFeed;const job=jobs.find(j=>String(j.id)===old.evidence?.sourceRecordId);if(!job)throw new Error('feed_missing_offer');fresh=parseJobbnorge(job,source,page);
 }else{const page=await getPage(old.url);fresh=parse(page.body,old.url,source,page,{institution:old.institution});}
 if(!fresh)throw new Error('known_offer_parse_failed');Object.assign(old,fresh,{lastError:null});counts.checked++;}
 catch(e){if(['http_404','http_410'].includes(e.message)){old.status='closed';old.closedAt=new Date().toISOString();counts.closed++;}else{old.lastError=e.message;old.lastAttemptAt=new Date().toISOString();old.status=effectiveStatus(old);counts.failed++;}}
}}
await Promise.all([worker(),worker(),worker()]);
await fs.writeFile('data/catalogue.json.tmp',JSON.stringify(data,null,2)+'\n');await fs.rename('data/catalogue.json.tmp','data/catalogue.json');await persistObservations();console.log(JSON.stringify(counts));
