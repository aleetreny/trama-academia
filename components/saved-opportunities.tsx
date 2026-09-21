'use client';

import {useState,useSyncExternalStore} from 'react';
import {Bookmark,Check} from 'lucide-react';
import {createSelectionStore,emptySelection,SELECTION_KEY,SELECTION_LIMIT,type SavedOpportunity} from '@/lib/saved-selection';
import './selection.css';

const store = createSelectionStore(() => window.localStorage);
let subscriptions = 0;
function onStorage(event:StorageEvent) {
  if (event.key === SELECTION_KEY || event.key === null) store.reload();
}
function subscribe(listener:()=>void) {
  const unsubscribe = store.subscribe(listener);
  if (subscriptions++ === 0) window.addEventListener('storage', onStorage);
  store.initialize();
  return () => {
    unsubscribe();
    if (--subscriptions === 0) window.removeEventListener('storage', onStorage);
  };
}
export function useSavedOpportunities() {
  const snapshot = useSyncExternalStore(subscribe, store.getSnapshot, () => emptySelection);
  return {...snapshot, remove:store.remove};
}
export function SavedSelectionCount() {
  const {entries} = useSavedOpportunities();
  return entries.length ? <span className="selection-count" aria-label={`${entries.length} guardadas`}>{entries.length}</span> : null;
}
export function SaveOpportunityButton({record,compact=false}:{record:SavedOpportunity;compact?:boolean}) {
  const {entries,ready,warning} = useSavedOpportunities();
  const [limit,setLimit] = useState(false);
  const selected = entries.some(item => item.id === record.id);
  return <span className="save-control">
    <button className={'save-opportunity'+(compact?' save-compact':'')} aria-pressed={selected}
      aria-label={`${selected?'Quitar de mi selección':'Guardar en mi selección'}: ${record.title}`}
      disabled={!ready} onClick={() => setLimit(store.toggle(record) === 'limit')}>
      {selected ? <Check size={16}/> : <Bookmark size={16}/>}
      <span>{selected?'Guardada':'Guardar'}</span>
    </button>
    {limit && <span className="save-feedback" role="status">Puedes guardar hasta {SELECTION_LIMIT}. Quita alguna desde Mi selección.</span>}
    {warning && <span className="save-feedback" role="status">Guardado solo durante esta visita.</span>}
  </span>;
}
