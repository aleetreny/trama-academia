export type SavedOpportunity = {id:string; title:string; institution:string};
export type SelectionSnapshot = {ready:boolean; entries:SavedOpportunity[]; warning:string|null};
type StorageLike = Pick<Storage, 'getItem'|'setItem'>;
export const SELECTION_KEY = 'trama:selection:v1';
export const SELECTION_LIMIT = 50;
export const emptySelection:SelectionSnapshot = {ready:false, entries:[], warning:null};

function validEntry(value:unknown):value is SavedOpportunity {
  if (!value || typeof value !== 'object') return false;
  const entry = value as SavedOpportunity;
  return typeof entry.id === 'string' && /^[a-f0-9]{20}$/.test(entry.id) && typeof entry.title === 'string' &&
    entry.title.length > 0 && entry.title.length <= 2000 &&
    typeof entry.institution === 'string' && entry.institution.length <= 1000;
}

export function parseSelection(raw:string|null):SavedOpportunity[] {
  if (raw === null) return [];
  const data = JSON.parse(raw);
  if (data?.version !== 1 || !Array.isArray(data.entries) ||
      data.entries.length > SELECTION_LIMIT || !data.entries.every(validEntry)) {
    throw new Error('Invalid saved selection');
  }
  return [...new Map<string,SavedOpportunity>(data.entries.map((entry:SavedOpportunity) =>
    [entry.id, {id:entry.id, title:entry.title, institution:entry.institution}])).values()];
}

// Persist identities and labels only; current conditions always come from the catalogue.
export function createSelectionStore(storage:()=>StorageLike) {
  let snapshot = emptySelection;
  const pending = new Map<string,SavedOpportunity|null>();
  const listeners = new Set<()=>void>();
  const notify = () => listeners.forEach(listener => listener());
  const readWarning = 'No se puede leer la selección guardada. Los cambios se conservarán solo durante esta visita; no se sobrescribirán los datos anteriores.';
  const writeWarning = 'El navegador no permite guardar los cambios. Esta selección se mantendrá solo durante esta visita.';
  function withPending(entries:SavedOpportunity[]) {
    const merged = new Map(entries.map(entry => [entry.id,entry]));
    for (const [id,entry] of pending) {if (entry) merged.set(id,entry);else merged.delete(id);}
    return [...merged.values()];
  }
  function read() {
    try {
      const entries = withPending(parseSelection(storage().getItem(SELECTION_KEY)));
      snapshot = {ready:true, entries, warning:pending.size?writeWarning:null};
    } catch {
      snapshot = {...snapshot, ready:true, warning:readWarning};
    }
    notify();
  }
  function change(id:string,entry:SavedOpportunity|null):boolean {
    let entries = snapshot.entries, warning:string|null = null, readable = true;
    // A storage event can arrive after a click in another tab. Re-read before
    // applying this tab's explicit intent, without discarding unwritten edits.
    try {entries=withPending(parseSelection(storage().getItem(SELECTION_KEY)));}
    catch {readable=false;warning=readWarning;}
    const merged = new Map(entries.map(item=>[item.id,item]));
    if (entry && !merged.has(id) && merged.size>=SELECTION_LIMIT) {
      snapshot={ready:true,entries,warning:warning||(pending.size?writeWarning:null)};notify();return false;
    }
    pending.set(id,entry);
    if (entry) merged.set(id,entry);else merged.delete(id);
    entries=[...merged.values()];
    if (readable && entries.length<=SELECTION_LIMIT) {
      try {
        storage().setItem(SELECTION_KEY, JSON.stringify({version:1, entries}));
        pending.clear();
      } catch {
        warning = writeWarning;
      }
    }
    if (pending.size && !warning) warning=writeWarning;
    snapshot = {ready:true, entries, warning};
    notify();
    return true;
  }
  return {
    getSnapshot: () => snapshot,
    initialize: () => {if (!snapshot.ready) read();},
    reload: read,
    subscribe: (listener:()=>void) => {listeners.add(listener); return () => {listeners.delete(listener);};},
    toggle(entry:SavedOpportunity):'added'|'removed'|'limit' {
      if (!validEntry(entry)) throw new Error('Invalid opportunity identity');
      if (!snapshot.ready) read();
      if (snapshot.entries.some(item => item.id === entry.id)) {
        change(entry.id,null);
        return 'removed';
      }
      if (!change(entry.id,{id:entry.id, title:entry.title, institution:entry.institution})) return 'limit';
      return 'added';
    },
    remove(id:string) {if (!snapshot.ready) read();change(id,null);},
  };
}

// Spreadsheet applications may interpret even quoted text as a formula.
export function selectionCsv(rows:string[][]) {
  return '\uFEFF' + rows.map(row => row.map(value => {
    const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? "'" + value : value;
    return '"' + safe.replaceAll('"','""') + '"';
  }).join(',')).join('\r\n');
}
