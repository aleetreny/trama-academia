import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {load} from 'cheerio';
const catalogue=JSON.parse(await fs.readFile('data/catalogue.json','utf8'));
const manifest=JSON.parse(await fs.readFile('out/data/manifest.json','utf8'));
const base=process.env.NEXT_PUBLIC_BASE_PATH??'/trama-academia';
const checkedFiles=new Map(),anchorIds=new Map();
let internalReferences=0;
const fileFor=pathname=>path.join('out',decodeURIComponent(pathname.slice(base.length)),pathname.endsWith('/')?'index.html':'');
async function checkLinks(html,route){
 const $=load(html);
 for(const element of $('[href],[src]').toArray()){
  const value=$(element).attr('href')||$(element).attr('src');
  if(!value||!value.startsWith('/')&&!value.startsWith('#'))continue;
  const url=new URL(value,'https://trama.invalid'+base+'/'+route);
  assert.equal(url.origin,'https://trama.invalid','Unexpected protocol-relative link: '+value);
  assert.ok(url.pathname.startsWith(base+'/'),'Missing project base: '+value);
  const file=fileFor(url.pathname);
  if(!checkedFiles.has(file))checkedFiles.set(file,fs.access(file));
  await checkedFiles.get(file);internalReferences++;
  if(url.hash){
   if(!anchorIds.has(file))anchorIds.set(file,fs.readFile(file,'utf8').then(body=>new Set(load(body)('[id]').toArray().map(element=>element.attribs.id))));
   assert.ok((await anchorIds.get(file)).has(decodeURIComponent(url.hash.slice(1))),'Missing anchor '+value+' from '+route);
  }
 }
}
const read=async name=>JSON.parse(await fs.readFile(path.join('out',name),'utf8'));
const indexes=await Promise.all(['explorer','funding'].map(key=>read(manifest.paths[key])));
const records=indexes.flatMap(x=>x.records),byId=new Map(records.map(r=>[r.id,r]));
assert.equal(records.length,catalogue.records.length);assert.equal(byId.size,records.length);
for(let offset=0;offset<catalogue.records.length;offset+=64){await Promise.all(catalogue.records.slice(offset,offset+64).map(async r=>{
 assert.deepEqual(await read(byId.get(r.id).detailPath),r,'Full evidence changed: '+r.id);
 const html=await fs.readFile(`out/oportunidad/${r.id}/index.html`,'utf8');
 assert.ok(html.includes('Fuente y trazabilidad'),'Missing detail: '+r.id);
 assert.ok(html.includes(`${base}/explorar/`)||html.includes(`${base}/financiacion/`)||html.includes(`${base}/programas/`),'Invalid return link: '+r.id);
 await checkLinks(html,`oportunidad/${r.id}/`);
}));}
const guides=JSON.parse(await fs.readFile('data/country-guides.json','utf8'));
const routes=['','explorar','financiacion','instituciones','fuentes','guia','programas',...guides.map(c=>'guia/'+c.code.toLowerCase())];
const pages={};
for(const route of routes){
 const html=await fs.readFile(path.join('out',route,'index.html'),'utf8');
 pages[route||'/']={htmlBytes:Buffer.byteLength(html),gzipBytes:gzipSync(html).length};
 assert.ok(Buffer.byteLength(html)<180000,'Initial page exceeds HTML budget: '+route);
 assert.ok(!/postgres(?:ql)?:\/\/|DATABASE_URL|neon\.tech/.test(html),'Runtime database leaked: '+route);
 await checkLinks(html,route?route+'/':'');
}
await checkLinks(await fs.readFile('out/404.html','utf8'),'404.html');
for(const [label,budget] of [['explorer',320000],['funding',80000],['institutions',1100000],['sources',200000]]){
 const content=await fs.readFile(path.join('out',manifest.paths[label]));assert.ok(gzipSync(content).length<=budget,label+' exceeds compressed index budget');
}
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const info={commit:sha,builtAt:new Date().toISOString(),catalogueGeneratedAt:catalogue.generatedAt,runId:catalogue.run?.id,records:records.length,sources:catalogue.sources.length,revision:manifest.revision,internalReferences,pages};
await fs.writeFile('out/.nojekyll','');await fs.writeFile('out/build-info.json',JSON.stringify(info,null,2));
const origin='https://aleetreny.github.io'+base;
await fs.writeFile('out/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...routes.map(r=>r?'/'+r+'/':'/'),...catalogue.records.map(r=>'/oportunidad/'+r.id+'/')].map(p=>'<url><loc>'+origin+p+'</loc></url>').join('')+'</urlset>');
console.log(JSON.stringify({verifiedDetails:records.length,pages,indexRevision:manifest.revision}));
