import fs from 'node:fs/promises';
import {gzip,gunzip} from 'node:zlib';
import {promisify} from 'node:util';

export const CRAWL_FILE='data/institution-crawl.json.gz';
const compress=promisify(gzip),expand=promisify(gunzip);
function validate(state){
 if(state?.schemaVersion!==1||!Array.isArray(state.jobs)||!Array.isArray(state.runs))throw new Error('invalid_crawl_state');
 return state;
}
export async function readCrawlState(file=CRAWL_FILE){
 let bytes;try{bytes=await fs.readFile(file);}catch(error){if(error.code==='ENOENT')return {schemaVersion:1,jobs:[],runs:[]};throw error;}
 // Corrupt or oversized data must fail, never silently reset the search history.
 return validate(JSON.parse((await expand(bytes,{maxOutputLength:512_000_000})).toString('utf8')));
}
export async function writeCrawlState(state,file=CRAWL_FILE){
 validate(state);
 const summaryFile=file.replace(/\.json\.gz$/,'.summary.json');
 if(summaryFile===file)throw new Error('crawl_state_requires_json_gz_extension');
 const bytes=await compress(Buffer.from(JSON.stringify(state)+'\n'),{level:6});
 await fs.writeFile(file+'.tmp',bytes);await fs.rename(file+'.tmp',file);
 // A small, reviewable companion; the compressed queue remains authoritative.
 const {jobs,...summary}=state;
 await fs.writeFile(summaryFile+'.tmp',JSON.stringify({...summary,serializedJobs:jobs.length},null,2)+'\n');
 await fs.rename(summaryFile+'.tmp',summaryFile);
}
