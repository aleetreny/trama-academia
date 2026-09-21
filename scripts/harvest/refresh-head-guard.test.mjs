import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertRefreshHead} from './refresh-head-guard.mjs';

test('publication continues only while origin/main still matches the inspected workflow commit',()=>{
 const expected='a'.repeat(40);
 assert.doesNotThrow(()=>assertRefreshHead(expected,expected));
 assert.throws(()=>assertRefreshHead(expected,'b'.repeat(40)),/refresh_head_changed/);
 for(const value of [undefined,'','not-a-commit']){
  assert.throws(()=>assertRefreshHead(value,expected),/refresh_head_unverified/);
  assert.throws(()=>assertRefreshHead(expected,value),/refresh_head_unverified/);
 }
});

test('an intervening main update stops the second guard and a later race is rejected by normal push',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'trama-refresh-head-'));
 t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const origin=path.join(dir,'origin.git'),checkout=path.join(dir,'checkout'),other=path.join(dir,'other');
 const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const commit=cwd=>git(cwd,'-c','user.name=Test','-c','user.email=test@example.invalid','commit','-m','fixture');
 git(dir,'init','--bare','--initial-branch=main',origin);git(dir,'clone',origin,checkout);
 await fs.writeFile(path.join(checkout,'initial.txt'),'initial');git(checkout,'add','.');commit(checkout);git(checkout,'push','origin','main');
 const original=git(checkout,'rev-parse','HEAD');
 const guard=fileURLToPath(new URL('./refresh-head-guard.mjs',import.meta.url));
 const inspect=()=>spawnSync(process.execPath,[guard],{cwd:checkout,encoding:'utf8',env:{...process.env,GITHUB_SHA:original}});
 assert.equal(inspect().status,0);
 git(dir,'clone',origin,other);await fs.writeFile(path.join(other,'new-main.txt'),'new edition');git(other,'add','.');commit(other);git(other,'push','origin','main');
 const newMain=git(other,'rev-parse','HEAD'),stale=inspect();
 assert.notEqual(stale.status,0);assert.match(stale.stderr,/refresh_head_changed/);
 assert.equal(git(checkout,'rev-parse','HEAD'),original);
 // If main moves after a guard, the existing non-force push is the final check.
 await fs.writeFile(path.join(checkout,'refresh.txt'),'reviewed local snapshot');git(checkout,'add','.');commit(checkout);
 const push=spawnSync('git',['push','origin','main'],{cwd:checkout,encoding:'utf8'});
 assert.notEqual(push.status,0);assert.equal(git(origin,'rev-parse','main'),newMain);
 assert.equal(await fs.readFile(path.join(checkout,'refresh.txt'),'utf8'),'reviewed local snapshot');
});
