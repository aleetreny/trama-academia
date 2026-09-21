import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
const catalogue=JSON.parse(await fs.readFile('data/catalogue.json','utf8'));
const manifest=JSON.parse(await fs.readFile('out/data/manifest.json','utf8'));
const base=process.env.NEXT_PUBLIC_BASE_PATH??'/trama-academia';
const read=async name=>JSON.parse(await fs.readFile(path.join('out',name),'utf8'));
const indexes=await Promise.all(['explorer','funding'].map(key=>read(manifest.paths[key])));
const records=indexes.flatMap(x=>x.records),byId=new Map(records.map(r=>[r.id,r]));
assert.equal(records.length,catalogue.records.length);assert.equal(byId.size,records.length);
for(let offset=0;offset<catalogue.records.length;offset+=64){await Promise.all(catalogue.records.slice(offset,offset+64).map(async r=>{
 assert.deepEqual(await read(byId.get(r.id).detailPath),r,'Full evidence changed: '+r.id);
 const html=await fs.readFile(`out/oportunidad/${r.id}/index.html`,'utf8');
 assert.ok(html.includes('Fuente y trazabilidad'),'Missing detail: '+r.id);
 assert.ok(html.includes(`${base}/explorar/`)||html.includes(`${base}/financiacion/`),'Invalid return link: '+r.id);
}));}
const pages={};
for(const route of ['','explorar','financiacion','instituciones','fuentes','guia']){
 const html=await fs.readFile(path.join('out',route,'index.html'),'utf8');
 pages[route||'/']={htmlBytes:Buffer.byteLength(html),gzipBytes:gzipSync(html).length};
 assert.ok(Buffer.byteLength(html)<180000,'Initial page exceeds HTML budget: '+route);
 assert.ok(!/postgres(?:ql)?:\/\/|DATABASE_URL|neon\.tech/.test(html),'Runtime database leaked: '+route);
 for(const match of html.matchAll(/(?:src|href)="(\/[^"#?]*)/g)){
  const url=match[1];assert.ok(url.startsWith(base+'/'),'Missing project base: '+url);
  const asset=url.slice(base.length);await fs.access(path.join('out',asset,asset.endsWith('/')?'index.html':''));
 }
}
for(const [label,budget] of [['explorer',320000],['funding',80000],['institutions',1100000],['sources',200000]]){
 const content=await fs.readFile(path.join('out',manifest.paths[label]));assert.ok(gzipSync(content).length<=budget,label+' exceeds compressed index budget');
}
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const info={commit:sha,builtAt:new Date().toISOString(),catalogueGeneratedAt:catalogue.generatedAt,runId:catalogue.run?.id,records:records.length,sources:catalogue.sources.length,revision:manifest.revision,pages};
await fs.writeFile('out/.nojekyll','');await fs.writeFile('out/build-info.json',JSON.stringify(info,null,2));
const origin='https://aleetreny.github.io'+base;
await fs.writeFile('out/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['/','/explorar/','/financiacion/','/instituciones/','/fuentes/','/guia/',...catalogue.records.map(r=>'/oportunidad/'+r.id+'/')].map(p=>'<url><loc>'+origin+p+'</loc></url>').join('')+'</urlset>');
console.log(JSON.stringify({verifiedDetails:records.length,pages,indexRevision:manifest.revision}));
