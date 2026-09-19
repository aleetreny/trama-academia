import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('audit and database publication reject an excluded row before contacting the database',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'trama-publication-'));
 try{
  await fs.mkdir(path.join(dir,'data'));
  await fs.writeFile(path.join(dir,'data/catalogue.json'),JSON.stringify({records:[{id:'excluded-example'}],sources:[]}));
  await fs.writeFile(path.join(dir,'data/exclusions.json'),JSON.stringify([{id:'excluded-example',reason:'Outside the research scope'}]));
  for(const [script,message]of [['./audit.mjs','editorially excluded record still active'],['../db/sync.mjs','Excluded record remains in the snapshot']]){
   assert.throws(()=>execFileSync(process.execPath,[fileURLToPath(new URL(script,import.meta.url))],{cwd:dir,env:{...process.env,DATABASE_URL:'postgresql://test:test@unreachable.invalid/test'},stdio:'pipe',timeout:5000}),error=>error.status===1&&String(error.stderr).includes(message));
  }
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
