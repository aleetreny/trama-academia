'use client';

import {lazy,Suspense,useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ArrowRight,Download,Search,Scale,X} from 'lucide-react';
import Link from './site-link';
import {OpportunityCard} from './opportunity-card';
import {useSavedOpportunities} from './saved-opportunities';
import {loadIndexes,loadDetails} from '@/lib/web-data';
import {selectionCsv} from '@/lib/saved-selection';
import {destinationLabel, funderCountryLabel,STAGES,STATUS_NAMES,statusOf,dateLabel,type Opportunity} from '@/lib/types';
import type {SearchData} from '@/lib/search';
import {sitePath} from '@/lib/site-path';
import './selection.css';

const Comparison = lazy(() => import('./comparison-dialog'));
const emptyData:SearchData = {generatedAt:null,researchGeneratedAt:null,records:[],institutions:{}};
export default function Selection() {
  const {entries,ready,warning,remove} = useSavedOpportunities();
  const [data,setData] = useState(emptyData);
  const [loaded,setLoaded] = useState(false);
  const [error,setError] = useState(false);
  const [refreshing,setRefreshing] = useState(true);
  const [revision,setRevision] = useState(0);
  const [details,setDetails] = useState<Record<string,Opportunity>>({});
  const [failed,setFailed] = useState<string[]>([]);
  const [compare,setCompare] = useState<string[]>([]);
  const [dialog,setDialog] = useState(false);
  const [exporting,setExporting] = useState(false);
  const [exportMessage,setExportMessage] = useState('');
  const [requestedPage,setPage] = useState(1);
  const request = useRef({version:0});
  const results = useRef<HTMLDivElement>(null);
  const compareButton = useRef<HTMLButtonElement>(null);
  const pageFocus = useRef(false);
  const hasEntries = entries.length > 0;
  const fetchData = useCallback((fresh=false) => {
    const version = ++request.current.version;
    return loadIndexes<SearchData>(['explorer','funding'],fresh).then(([opportunities,funding]) => {
      if (version !== request.current.version) return;
      setData({...opportunities,records:[...opportunities.records,...funding.records],institutions:{...opportunities.institutions,...funding.institutions}});
      setLoaded(true);setError(false);
    }).catch(() => {
      if (version === request.current.version) setError(true);
    }).finally(() => {
      if (version === request.current.version) setRefreshing(false);
    });
  },[]);
  useEffect(() => {
    if (!hasEntries) return;
    const activeRequest = request.current;
    void fetchData();
    return () => {activeRequest.version++;};
  },[hasEntries,fetchData]);
  const byId = useMemo(() => new Map(data.records.map(record => [record.id,record])),[data]);
  const pages = Math.max(1,Math.ceil(entries.length/12));
  const page = Math.min(requestedPage,pages);
  if (page !== requestedPage) setPage(page);
  const visible = [...entries].reverse().slice((page-1)*12,page*12);
  const selectedIds = compare.filter(id => entries.some(entry => entry.id === id) && byId.has(id));
  const paths = [...new Set([...visible.map(entry => byId.get(entry.id)?.detailPath),...selectedIds.map(id => byId.get(id)?.detailPath)].filter((path):path is string => Boolean(path)))].join('|');
  useEffect(() => {
    if (!paths) return;
    let active = true;
    void loadDetails(paths.split('|'),revision > 0).then(result => {
      if (active) {setDetails(previous => ({...previous,...result.records}));setFailed(result.failedPaths);}
    });
    return () => {active=false;};
  },[paths,revision]);
  useEffect(() => {
    if (pageFocus.current) {
      pageFocus.current=false;
      results.current?.focus({preventScroll:true});
      results.current?.scrollIntoView({block:'start'});
    }
  },[page]);
  const selected = selectedIds.map(id => details[byId.get(id)!.detailPath]).filter(Boolean);
  // An edit in another tab can remove a compared item while the dialog is open.
  if (dialog && selected.length<2) setDialog(false);
  const toggleCompare = (id:string) => setCompare(previous => {
    const current = previous.filter(value => entries.some(entry => entry.id===value));
    return current.includes(id)?current.filter(value => value!==id):current.length<3?[...current,id]:current;
  });
  const changePage = (next:number) => {pageFocus.current=true;setPage(next);};
  async function download() {
    setExporting(true);setExportMessage('');
    try {
      const current = entries.map(entry => byId.get(entry.id));
      const response = await loadDetails(current.flatMap(record => record?[record.detailPath]:[]));
      if (response.failedPaths.length) throw new Error('Missing conditions');
      const rows = [['Programa o plaza','Institución','Destino', 'País de la entidad financiadora','Etapa','Estado','Financiación','Cierre','Calendario de la edición','Comprobación','Fuente oficial','Ficha TRAMA']];
      for (const entry of entries) {
        const index = byId.get(entry.id);
        const record = index && response.records[index.detailPath];
        rows.push(record ? [record.title,record.institution,destinationLabel(record), record.funderCountry ? funderCountryLabel(record.funderCountry) : '',
          STAGES.find(stage => stage.id===record.stage)?.short||record.stage,STATUS_NAMES[statusOf(record)],
          record.funding.text,record.deadline||'',record.recurrence?.calendar||'',record.verifiedAt||'',record.url,
          new URL(sitePath('/oportunidad/'+record.id),location.origin).href] :
          [entry.title,entry.institution,'','','','No disponible en esta edición','','','','','','']);
      }
      const blob = new Blob([selectionCsv(rows)],{type:'text/csv;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href=url;anchor.download='trama-mi-seleccion.csv';anchor.click();
      setTimeout(() => URL.revokeObjectURL(url),1000);
      setExportMessage('Lista exportada. Las condiciones corresponden a esta edición del catálogo.');
    } catch {
      setExportMessage('No se pudieron cargar todas las condiciones. Reintenta la exportación; tu selección sigue guardada.');
    } finally {setExporting(false);}
  }
  return <main id="contenido" className={'wrap selection-page'+(selectedIds.length?' selection-comparing':'')}>
    <header className="selection-heading"><div><h1>Mi selección</h1><p>Reúne las opciones que te interesan, compara sus condiciones y lleva tu lista a una hoja de cálculo.</p></div><Link href="/explorar">Seguir explorando <ArrowRight size={17}/></Link></header>
    <p className="selection-note" style={{marginTop:18}}>Se guarda en este navegador, sin cuenta. No se sincroniza entre dispositivos y se pierde si borras los datos del sitio. Puedes conservar una copia con «Exportar lista».</p>
    {warning && <p className="notice" role="alert">{warning}</p>}
    {!ready ? <p role="status">Cargando tu selección…</p> : !hasEntries ? <section className="selection-empty"><h2>Empieza por una opción que te interese.</h2><p>Pulsa «Guardar» en cualquier ficha. Podrás volver aquí para comparar hasta tres opciones y consultar los plazos, incluso después de cerrar la pestaña.</p><div className="selection-empty-links"><Link className="primary-button" href="/explorar"><Search size={17}/> Explorar oportunidades</Link><Link className="text-link" href="/programas">Ver programas recurrentes <ArrowRight size={16}/></Link></div></section> : <>
      <div className="selection-tools" ref={results} tabIndex={-1} aria-label="Tu selección"><p role="status"><strong>{entries.length}</strong> {entries.length===1?'opción guardada':'opciones guardadas'}</p><div className="selection-tools-actions"><button onClick={download} disabled={!loaded||error||exporting}><Download size={16}/>{exporting?'Preparando lista…':'Exportar lista'}</button></div></div>
      <p className="selection-note">Las condiciones se leen de la edición actual{data.generatedAt?` (${dateLabel(data.generatedAt)})`:''}. Guardar una ficha no la mantiene abierta ni reserva una plaza. Marca dos o tres casillas para comparar.</p>
      {error && <p className="notice" role="alert">No se pudo consultar el catálogo. Tu selección se conserva. <button className="selection-retry" disabled={refreshing} onClick={() => {setRefreshing(true);void fetchData(true);}}>{refreshing?'Reintentando…':'Reintentar'}</button></p>}
      {failed.length>0 && <p className="notice" role="alert">Algunas condiciones no se pudieron cargar. <button className="selection-retry" onClick={() => setRevision(value=>value+1)}>Reintentar condiciones</button></p>}
      {exportMessage && <p role="status" className="selection-note">{exportMessage}</p>}
      <div className="selection-list">{visible.map(entry => {
        const index = byId.get(entry.id);
        if (!index) return <article className="selection-unavailable" key={entry.id}><p>{entry.institution}</p><h2>{entry.title}</h2><p>{loaded&&!error?'Esta ficha no está disponible en la edición actual. Se conserva en tu lista para que puedas identificarla.':error?'Las condiciones no están disponibles mientras falla la conexión.':'Cargando condiciones actuales…'}</p><button className="selection-remove" onClick={() => remove(entry.id)} aria-label={'Quitar de mi selección: '+entry.title}>Quitar de mi selección</button></article>;
        return <OpportunityCard key={entry.id} record={details[index.detailPath]||{...index,entry:'',funding:{...index.funding,text:''}}} loading={!details[index.detailPath]} unavailable={failed.includes(index.detailPath)} returnHref="/seleccion" selected={selectedIds.includes(entry.id)} onCompare={toggleCompare} compareDisabled={!selectedIds.includes(entry.id)&&(!details[index.detailPath]||selectedIds.length>=3)}/>;
      })}</div>
      {pages>1 && <nav className="results-pagination" aria-label="Páginas de mi selección"><button disabled={page===1} onClick={() => changePage(page-1)}>Anterior</button><span>Página {page} de {pages}</span><button disabled={page===pages} onClick={() => changePage(page+1)}>Siguiente <ArrowRight size={16}/></button></nav>}
    </>}
    {selectedIds.length>0 && <div className="compare-tray"><Scale size={21}/><span>{selectedIds.length} de 3 para comparar</span><button ref={compareButton} className="primary-button" disabled={selected.length<2} onClick={() => setDialog(true)}>Comparar condiciones</button><button aria-label="Vaciar comparación" onClick={() => setCompare([])}><X size={20}/></button></div>}
    {dialog && <Suspense fallback={<p role="status">Abriendo comparación…</p>}><Comparison selected={selected} returnHref="/seleccion" onClose={() => setDialog(false)} onRestoreFocus={() => (compareButton.current||results.current)?.focus()}/></Suspense>}
  </main>;
}
