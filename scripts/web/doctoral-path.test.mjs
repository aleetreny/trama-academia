import test from 'node:test';
import assert from 'node:assert/strict';
import {AIMS,MOBILITY,PATH_FIELDS,SITUATIONS,PATH_ACTIONS,PATH_KEY,createPathStore,defaultProfile,parsePath,pathActions,pathSearches} from '../../lib/doctoral-path.ts';
import {readFilters} from '../../lib/search.ts';
function memory(initial=null){let raw=initial;return {getItem:key=>{assert.equal(key,PATH_KEY);return raw;},setItem:(key,value)=>{assert.equal(key,PATH_KEY);raw=value;},raw:()=>raw};}
test('all 216 profile combinations create valid actions and filters without deciding eligibility',()=>{
  for(const [situation] of SITUATIONS)for(const [aim] of AIMS)for(const [mobility] of MOBILITY)for(const [field] of PATH_FIELDS){
    const profile={situation,aim,mobility,field};
    const actions=pathActions(profile);assert.ok(actions.length>=5);assert.equal(new Set(actions.map(x=>x.id)).size,actions.length);
    for(const search of pathSearches(profile)){
      const url=new URL(search.href,'https://example.test');assert.ok(['/explorar','/financiacion','/programas'].includes(url.pathname));
      if(url.pathname==='/programas')continue;
      const filters=readFilters(url.searchParams);
      assert.equal(filters.country,mobility==='espana'?'ES':'all');
      if(url.pathname==='/financiacion')assert.equal(filters.field,'all');else assert.equal(filters.field,field);
    }
  }
});
test('work transition includes time and access; asking to apply includes funding and candidature',()=>{
  const ids=pathActions({...defaultProfile,situation:'trabajo',aim:'solicitar',mobility:'europa'}).map(x=>x.id);
  for(const id of ['bridge','time','access','funding','application','compare'])assert.ok(ids.includes(id));
});
test('plan persists choices and progress separately from opportunity selection',()=>{
  const storage=memory(),store=createPathStore(()=>storage);store.initialize();assert.equal(store.getSnapshot().configured,false);
  store.change({situation:'trabajo',mobility:'espana'});store.complete('access',true);
  const reopened=createPathStore(()=>storage);reopened.initialize();assert.equal(reopened.getSnapshot().configured,true);
  assert.equal(reopened.getSnapshot().data.profile.situation,'trabajo');assert.deepEqual(reopened.getSnapshot().data.completed,['access']);
  reopened.change({aim:'solicitar'});assert.deepEqual(reopened.getSnapshot().data.completed,['access']);
  reopened.reset();assert.deepEqual(reopened.getSnapshot().data.profile,defaultProfile);assert.deepEqual(reopened.getSnapshot().data.completed,[]);
});
test('invalid existing plan is not overwritten; local controls remain usable',()=>{
  for(const raw of ['{bad','{"version":2}',JSON.stringify({version:1,profile:defaultProfile,completed:['__proto__']})]){
    const storage=memory(raw),store=createPathStore(()=>storage);store.initialize();store.change({situation:'master'});store.complete('access',true);
    assert.equal(storage.raw(),raw);assert.equal(store.getSnapshot().data.profile.situation,'master');assert.ok(store.getSnapshot().data.completed.includes('access'));assert.ok(store.getSnapshot().warning);
  }
});
test('storage denial and quota failures keep pending changes and recover',()=>{
  const denied=createPathStore(()=>{throw new Error('denied');});denied.initialize();denied.change({situation:'trabajo'});assert.equal(denied.getSnapshot().data.profile.situation,'trabajo');assert.ok(denied.getSnapshot().warning);
  const storage=memory();let fail=true;const store=createPathStore(()=>({...storage,setItem:(key,value)=>{if(fail)throw new Error('quota');storage.setItem(key,value);}}));
  store.change({mobility:'espana'});store.complete('access',true);store.reload();assert.equal(store.getSnapshot().data.profile.mobility,'espana');assert.ok(store.getSnapshot().data.completed.includes('access'));
  fail=false;store.change({aim:'solicitar'});assert.equal(store.getSnapshot().warning,null);assert.deepEqual(parsePath(storage.raw()).completed,['access']);assert.equal(parsePath(storage.raw()).profile.mobility,'espana');
});
test('two tabs reread before changing only their own field or action',()=>{
  const storage=memory(),a=createPathStore(()=>storage),b=createPathStore(()=>storage);a.initialize();b.initialize();
  a.change({mobility:'europa'});b.change({situation:'master'});a.complete('access',true);b.complete('tfm',true);
  assert.equal(parsePath(storage.raw()).profile.mobility,'europa');assert.equal(parsePath(storage.raw()).profile.situation,'master');assert.deepEqual(new Set(parsePath(storage.raw()).completed),new Set(['access','tfm']));
  a.complete('access',false);b.reload();assert.deepEqual(b.getSnapshot().data.completed,['tfm']);
});
test('untrusted storage cannot introduce profiles, links or unlimited actions',()=>{
  assert.throws(()=>parsePath(JSON.stringify({version:1,profile:{...defaultProfile,field:'external'},completed:[]})));
  assert.throws(()=>parsePath(JSON.stringify({version:1,profile:defaultProfile,completed:Array(50).fill('access')})));
  const data=parsePath(JSON.stringify({version:1,profile:{...defaultProfile,extra:'secret'},completed:['access','access'],other:'secret'}));assert.equal(JSON.stringify(data).includes('secret'),false);assert.deepEqual(data.completed,['access']);
  assert.ok(Object.values(PATH_ACTIONS).every(action=>action.href.startsWith('/')));
});
