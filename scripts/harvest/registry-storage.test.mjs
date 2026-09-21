import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {readInstitutionRegistry,writeInstitutionRegistry} from './registry-storage.mjs';
const sample={generatedAt:'2026-09-21T00:00:00Z',research:{subjects:['cs','statistics']},institutions:Array.from({length:13},(_,id)=>({id:String(id),name:'Lodz / Łódź / Αθήνα',sources:[{url:'https://example.edu/'+id,contentHash:'verified'}],researchMetrics:{cs:{volume:id,tier:null}}}))};
async function fixture(t){const directory=await fs.mkdtemp(path.join(os.tmpdir(),'trama-registry-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));return path.join(directory,'institutions.json');}
test('shards preserve Unicode, provenance, ordering and the bundled fallback exactly',async t=>{
 const file=await fixture(t),report=await writeInstitutionRegistry(sample,file,{maxBytes:650});
 assert(report.parts>1);assert(report.maxPartBytes<=650);
 assert.deepEqual(await readInstitutionRegistry(file),sample);
 assert.deepEqual((await import(pathToFileURL(file.replace('.json','.snapshot.mjs')))).default,sample);
 const manifest=JSON.parse(await fs.readFile(file,'utf8'));assert(!('institutions' in manifest));
 for(const part of manifest.registryStorage.parts)assert((await fs.stat(path.join(path.dirname(file),part.file))).size<=650);
});
test('legacy registries migrate without changing their logical contents',async t=>{
 const file=await fixture(t);await fs.writeFile(file,JSON.stringify(sample));
 assert.deepEqual(await readInstitutionRegistry(file),sample);
 await writeInstitutionRegistry(await readInstitutionRegistry(file),file,{maxBytes:650});
 assert.deepEqual(await readInstitutionRegistry(file),sample);
});
test('updates replace a full edition and rejected oversized rows preserve the last good edition',async t=>{
 const file=await fixture(t);await writeInstitutionRegistry(sample,file,{maxBytes:650});
 await assert.rejects(writeInstitutionRegistry(sample,file,{maxBytes:40}),/institution_exceeds_part_budget/);
 assert.deepEqual(await readInstitutionRegistry(file),sample);
 const next={...sample,institutions:sample.institutions.slice(0,2)};await writeInstitutionRegistry(next,file,{maxBytes:650});
 assert.deepEqual(await readInstitutionRegistry(file),next);
 assert.equal((await fs.readdir(path.join(path.dirname(file),'institutions.parts'))).length,1);
});
test('a changed shard or invalid manifest is rejected instead of returning a partial registry',async t=>{
 const file=await fixture(t);await writeInstitutionRegistry(sample,file,{maxBytes:650});
 const manifest=JSON.parse(await fs.readFile(file,'utf8')),part=path.join(path.dirname(file),manifest.registryStorage.parts[0].file);
 await fs.writeFile(part,'[]\n');await assert.rejects(readInstitutionRegistry(file),/registry_part_hash_mismatch/);
 manifest.registryStorage.parts[0].file='../elsewhere.json';await fs.writeFile(file,JSON.stringify(manifest));
 await assert.rejects(readInstitutionRegistry(file),/invalid_registry_part_path/);
});
