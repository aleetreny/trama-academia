import test from 'node:test';
import assert from 'node:assert/strict';
import {createSelectionStore,parseSelection,selectionCsv,SELECTION_KEY,SELECTION_LIMIT} from '../../lib/saved-selection.ts';
const entry = n => ({id:n.toString(16).padStart(20,'0'),title:'Estadística '+n,institution:'Universidad'});
function memory(initial=null) {
  let value=initial;
  return {getItem:key => {assert.equal(key,SELECTION_KEY);return value;},setItem:(key,next) => {assert.equal(key,SELECTION_KEY);value=next;},raw:()=>value};
}
test('saved identities survive a new store without persisting academic conditions', () => {
  const storage=memory();
  const first=createSelectionStore(()=>storage);
  first.toggle({...entry(1),funding:'outdated'});
  const reopened=createSelectionStore(()=>storage);
  reopened.initialize();
  assert.deepEqual(reopened.getSnapshot().entries,[entry(1)]);
  assert.equal(storage.raw().includes('outdated'),false);
  assert.equal(reopened.toggle(entry(1)),'removed');
  assert.deepEqual(parseSelection(storage.raw()),[]);
});
test('removing before subscription preserves all other saved identities', () => {
  const storage=memory(JSON.stringify({version:1,entries:[entry(1),entry(2)]}));
  const store=createSelectionStore(()=>storage);
  store.remove(entry(1).id);
  assert.deepEqual(parseSelection(storage.raw()),[entry(2)]);
});
test('invalid storage is never overwritten and temporary selection remains usable', () => {
  for (const raw of ['{bad','{"version":2,"entries":[]}']) {
    const storage=memory(raw),store=createSelectionStore(()=>storage);
    store.toggle(entry(1));
    assert.deepEqual(store.getSnapshot().entries,[entry(1)]);
    assert.ok(store.getSnapshot().warning);
    assert.equal(storage.raw(),raw);
  }
});
test('denied storage preserves a session selection and exposes persistence failure', () => {
  const store=createSelectionStore(()=>{throw new Error('Storage denied');});
  store.toggle(entry(1));
  assert.equal(store.getSnapshot().entries.length,1);
  assert.ok(store.getSnapshot().warning);
  const failWrite=createSelectionStore(()=>({getItem:()=>null,setItem:()=>{throw new Error('Quota exceeded');}}));
  failWrite.toggle(entry(2));
  assert.equal(failWrite.getSnapshot().entries.length,1);
  assert.ok(failWrite.getSnapshot().warning);
});
test('reload reflects changes from another tab, including site data cleared', () => {
  const storage=memory(),a=createSelectionStore(()=>storage),b=createSelectionStore(()=>storage);
  a.toggle(entry(1));b.initialize();a.toggle(entry(2));b.reload();
  assert.deepEqual(b.getSnapshot().entries,[entry(1),entry(2)]);
  storage.setItem(SELECTION_KEY,JSON.stringify({version:1,entries:[]}));b.reload();
  assert.deepEqual(b.getSnapshot().entries,[]);
});
test('a tab adding before its storage event arrives preserves the other tabs new choice', () => {
  const storage=memory(),a=createSelectionStore(()=>storage),b=createSelectionStore(()=>storage);
  a.initialize();b.initialize();
  a.toggle(entry(1));
  b.toggle(entry(2));
  assert.deepEqual(parseSelection(storage.raw()),[entry(1),entry(2)]);
});
test('a stale tab removes only the requested choice and preserves a concurrent addition', () => {
  const storage=memory(JSON.stringify({version:1,entries:[entry(1)]}));
  const a=createSelectionStore(()=>storage),b=createSelectionStore(()=>storage);
  a.initialize();b.initialize();
  a.toggle(entry(2));
  b.remove(entry(1).id);
  assert.deepEqual(parseSelection(storage.raw()),[entry(2)]);
});
test('two stale save buttons keep their add intent instead of toggling the other tabs addition off', () => {
  const storage=memory(),a=createSelectionStore(()=>storage),b=createSelectionStore(()=>storage);
  a.initialize();b.initialize();
  assert.equal(a.toggle(entry(1)),'added');
  assert.equal(b.toggle(entry(1)),'added');
  assert.deepEqual(parseSelection(storage.raw()),[entry(1)]);
});
test('recovering from a failed write persists all choices retained during this visit', () => {
  const storage=memory();
  let denied=true;
  const store=createSelectionStore(()=>({getItem:storage.getItem,setItem:(key,value)=>{
    if(denied)throw new Error('Quota temporarily exceeded');
    storage.setItem(key,value);
  }}));
  store.toggle(entry(1));
  assert.ok(store.getSnapshot().warning);
  denied=false;
  store.toggle(entry(2));
  assert.deepEqual(parseSelection(storage.raw()),[entry(1),entry(2)]);
  assert.equal(store.getSnapshot().warning,null);
});
test('a pending removal survives another tabs reload and is persisted when writing recovers', () => {
  const storage=memory(JSON.stringify({version:1,entries:[entry(1)]}));
  let denied=true;
  const local=createSelectionStore(()=>({getItem:storage.getItem,setItem:(key,value)=>{
    if(denied)throw new Error('Quota temporarily exceeded');
    storage.setItem(key,value);
  }}));
  local.remove(entry(1).id);
  const other=createSelectionStore(()=>storage);
  other.toggle(entry(2));
  local.reload();
  assert.deepEqual(local.getSnapshot().entries,[entry(2)]);
  assert.ok(local.getSnapshot().warning);
  denied=false;
  local.toggle(entry(3));
  assert.deepEqual(parseSelection(storage.raw()),[entry(2),entry(3)]);
  assert.equal(local.getSnapshot().warning,null);
});
test('limit rejects additions without truncating prior choices and removal frees a slot', () => {
  const storage=memory(),store=createSelectionStore(()=>storage);
  for (let i=1;i<=SELECTION_LIMIT;i++) assert.equal(store.toggle(entry(i)),'added');
  assert.equal(store.toggle(entry(99)),'limit');
  assert.equal(store.getSnapshot().entries.length,SELECTION_LIMIT);
  store.remove(entry(1).id);
  assert.equal(store.toggle(entry(99)),'added');
});
test('saved storage rejects unsafe identity types and normalizes duplicate metadata', () => {
  for (const value of [{...entry(1),id:10000000000000000000},{...entry(1),id:'../outside'},{...entry(1),title:''}]) {
    assert.throws(()=>parseSelection(JSON.stringify({version:1,entries:[value]})));
  }
  assert.deepEqual(parseSelection(JSON.stringify({version:1,entries:[entry(1),{...entry(1),title:'Nuevo nombre',arbitrary:'drop'}]})),[{...entry(1),title:'Nuevo nombre'}]);
});
test('CSV preserves accents, commas and line breaks while neutralizing spreadsheet formulas', () => {
  const csv=selectionCsv([['Estadística, "tesis"','Línea\nnueva','=HYPERLINK("x")',' +SUM(1,2)','@cmd','-1','https://example.org']]);
  assert.equal(csv,'\uFEFF"Estadística, ""tesis""","Línea\nnueva","\'=HYPERLINK(""x"")","\' +SUM(1,2)","\'@cmd","\'-1","https://example.org"');
});
