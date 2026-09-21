'use client';

import {
  lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  Search, ArrowRight, RefreshCw, X, Scale, ArrowUpRight, SlidersHorizontal, ChevronDown,
} from 'lucide-react';
import Link from './site-link';
import {OpportunityCard} from './opportunity-card';
import {STAGES, FIELDS, COUNTRY_NAMES, dateLabel, type Opportunity} from '@/lib/types';
import {
  defaults, readFilters, filterQuery, selectRecords, researchMetric, isRanked, SUBJECTS,
  type Filters, type SearchData,
} from '@/lib/search';
import {loadIndex, loadDetails} from '@/lib/web-data';
import './explorer.css';

const Comparison = lazy(() => import('./comparison-dialog'));
type Options = readonly (readonly [string, string])[];
type FilterKey = Exclude<keyof Filters, 'page' | 'sort'>;
type StartingSearch = {label: string; filters: Partial<Filters>};

const KIND_OPTIONS: Options = [
  ['all', 'Vacantes y programas'], ['position', 'Vacantes'],
  ['programme', 'Programas'], ['master-programme', 'Programas de máster'],
];
const STATUS_OPTIONS: Options = [
  ['current', 'Abiertas, publicadas y programas'], ['open', 'Solo plazo abierto'],
  ['rolling', 'Admisión continua'], ['programme', 'Programas: consultar convocatoria'],
  ['listed', 'Publicadas sin fecha'], ['unverified', 'Por confirmar'],
  ['closed', 'Plazo cerrado'], ['all', 'Todo el archivo'],
];
const FUNDING_OPTIONS: Options = [
  ['all', 'Cualquier financiación'], ['salary', 'Salario o contrato'],
  ['scholarship', 'Beca o estipendio'], ['waiver', 'Exención de matrícula'],
  ['grant', 'Ayuda o subvención'], ['mixed', 'Financiación mixta'],
  ['unconfirmed', 'Sin financiación confirmada'],
];
const TIER_OPTIONS: Options = [
  ['all', 'Todos, incluidos sin tier'], ['T1', 'T1 · 10 % superior'],
  ['T1T2', 'T1 + T2 · 25 % superior'], ['T2', 'T2'], ['T3', 'T3'], ['T4', 'T4'],
  ['ranked', 'Con tier calculado'], ['unranked', 'Sin tier calculado'],
];
const LANGUAGE_OPTIONS: Options = [
  ['all', 'Cualquier idioma'], ['english', 'Inglés'], ['spanish', 'Español'],
  ['french', 'Francés'], ['german', 'Alemán'],
];
const CLOSING_OPTIONS: Options = [
  ['all', 'Cualquier plazo'], ['7', 'Próximos 7 días'],
  ['30', 'Próximos 30 días'], ['90', 'Próximos 90 días'],
];
const SORT_OPTIONS: Options = [
  ['prestige', 'Prestigio investigador'], ['impact', 'Impacto: proporción top 10 %'],
  ['volume', 'Actividad investigadora'], ['deadline', 'Próximo cierre'],
  ['recent', 'Última comprobación'], ['institution', 'Institución A–Z'], ['title', 'Título A–Z'],
];
const STARTING_SEARCHES: StartingSearch[] = [
  {label: 'Máster con investigación', filters: {stage: 'master', kind: 'master-programme'}},
  {label: 'Plazas doctorales', filters: {stage: 'doctorado', kind: 'position'}},
  {label: 'Primeras experiencias', filters: {stage: 'grado'}},
  {label: 'Postdoc', filters: {stage: 'postdoc'}},
];
const FUNDING_SEARCHES: StartingSearch[] = [
  {label: 'Financiar un máster', filters: {stage: 'master'}},
  {label: 'Financiar un doctorado', filters: {stage: 'doctorado'}},
  {label: 'Ayudas postdoctorales', filters: {stage: 'postdoc'}},
  {label: 'Becas y estipendios', filters: {funding: 'scholarship'}},
];
const emptyData: SearchData = {
  generatedAt: null, researchGeneratedAt: null, records: [], institutions: {},
};
const optionLabel = (options: Options, value: string) =>
  options.find(([key]) => key === value)?.[1] || value;

function Choice({label, value, onChange, options}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Options;
}) {
  return (
    <label className="filter-choice">
      <span>{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)}>
        {options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
      </select>
    </label>
  );
}

export default function Explorer({funding = false}: {funding?: boolean}) {
  const [data, setData] = useState<SearchData>(emptyData);
  const [f, setF] = useState<Filters>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState(false);
  const [detailResult, setDetailResult] = useState({
    key: '', revision: 0, errors: [] as string[] | null,
  });
  const [detailRevision, setDetailRevision] = useState(0);
  const [details, setDetails] = useState<Record<string, Opportunity>>({});
  const [compare, setCompare] = useState<string[]>([]);
  const [dialog, setDialog] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const indexRequest = useRef({version: 0});
  const lastDetailRevision = useRef(0);
  const pageFocus = useRef(false);
  const pendingFilterFocus = useRef(false);
  const resultsHeading = useRef<HTMLDivElement>(null);
  const comparisonButton = useRef<HTMLButtonElement>(null);
  const query = useDeferredValue(f.q);

  const fetchIndex = useCallback((fresh = true) => {
    const request = ++indexRequest.current.version;
    return loadIndex<SearchData>(funding ? 'funding' : 'explorer', fresh)
      .then(updated => {
        if (!Array.isArray(updated.records) || !updated.institutions) throw new Error();
        if (request !== indexRequest.current.version) return;
        setData(updated);
        setCompare(ids => ids.filter(id => updated.records.some(record => record.id === id)));
        setLoaded(true);
        setError(false);
        if (fresh) setDetailRevision(value => value + 1);
      })
      .catch(() => {
        if (request === indexRequest.current.version) setError(true);
      })
      .finally(() => {
        if (request === indexRequest.current.version) setRefreshing(false);
      });
  }, [funding]);

  const refresh = useCallback((fresh = true) => {
    setRefreshing(true);
    void fetchIndex(fresh);
  }, [fetchIndex]);

  useEffect(() => {
    const requestState = indexRequest.current;
    const sync = () => setF(readFilters(new URLSearchParams(location.search)));
    sync();
    window.addEventListener('popstate', sync);
    void fetchIndex(false);
    const timer = setInterval(() => void refresh(true), 300000);
    return () => {
      requestState.version++;
      clearInterval(timer);
      window.removeEventListener('popstate', sync);
    };
  }, [fetchIndex, refresh]);

  useEffect(() => {
    if (!loaded) return;
    const url = new URL(location.href);
    url.search = filterQuery(f).toString();
    history.replaceState(null, '', url);
  }, [f, loaded]);

  const change = (key: Exclude<keyof Filters, 'page'>, value: string) =>
    setF(previous => ({...previous, [key]: value, page: 1}));
  const reset = () => {
    setF({...defaults});
    setCompare([]);
  };
  const filtered = useMemo(() => selectRecords(data, {...f, q: query}), [data, f, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / 12));
  const page = Math.min(f.page, pages);
  const visible = filtered.slice((page - 1) * 12, page * 12);
  // Clamp this component’s own state before committing an out-of-range URL.
  if (loaded && f.page !== page) setF({...f, page});

  const recordById = useMemo(() => new Map(data.records.map(record => [record.id, record])), [data]);
  const detailKey = [...new Set([
    ...visible.map(record => record.detailPath),
    ...compare.map(id => recordById.get(id)?.detailPath).filter((path): path is string => Boolean(path)),
  ])].join('|');
  // Reset completion when the requested paths change, including an A → B → A retry.
  if (detailResult.key !== detailKey || detailResult.revision !== detailRevision) {
    setDetailResult({key: detailKey, revision: detailRevision, errors: null});
  }
  const detailsLoading = Boolean(detailKey && detailResult.errors === null);
  const detailErrors = detailKey ? detailResult.errors || [] : [];

  useEffect(() => {
    if (!detailKey) return;
    let active = true;
    const fresh = lastDetailRevision.current !== detailRevision;
    lastDetailRevision.current = detailRevision;
    void loadDetails(detailKey.split('|'), fresh).then(({records, failedPaths}) => {
      if (active) {
        setDetails(previous => ({...previous, ...records}));
        setDetailResult({key: detailKey, revision: detailRevision, errors: failedPaths});
      }
    });
    return () => { active = false; };
  }, [detailKey, detailRevision]);

  useEffect(() => {
    if (pageFocus.current) {
      pageFocus.current = false;
      resultsHeading.current?.focus({preventScroll: true});
      resultsHeading.current?.scrollIntoView({block: 'start'});
    }
  }, [page]);

  useEffect(() => {
    if (!filtersOpen && pendingFilterFocus.current) {
      pendingFilterFocus.current = false;
      resultsHeading.current?.focus({preventScroll: true});
      resultsHeading.current?.scrollIntoView({block: 'start'});
    }
  }, [filtersOpen]);

  const goToPage = (next: number) => {
    pageFocus.current = true;
    setF(previous => ({...previous, page: next}));
  };
  const countries = useMemo(() => [...new Set(data.records.map(record => record.country))]
    .sort((a, b) => (COUNTRY_NAMES[a] || a).localeCompare(COUNTRY_NAMES[b] || b, 'es')), [data]);
  const eligible = useMemo(() => data.records.filter(record =>
    f.stage === 'all' || record.stage === f.stage || record.eligibleStages?.includes(f.stage as Opportunity['stage']),
  ), [data, f.stage]);
  const ranked = eligible.filter(record => isRanked(researchMetric(record, data, f.subject))).length;
  const selected = compare.map(id => details[recordById.get(id)?.detailPath || '']).filter(Boolean);
  const toggle = (id: string) => setCompare(previous => previous.includes(id)
    ? previous.filter(selectedId => selectedId !== id)
    : previous.length < 3 && details[recordById.get(id)?.detailPath || ''] ? [...previous, id] : previous);
  const closeComparison = () => setDialog(false);
  const subjectLabel = optionLabel(SUBJECTS, f.subject);
  const stageOptions: Options = [['all', 'Todas las etapas'], ...STAGES.map(stage => [stage.id, stage.short] as const)];
  const countryOptions: Options = [
    ['all', 'Todos los países'], ...countries.map(country => [country, COUNTRY_NAMES[country] || country] as const),
    // Keep a valid URL-selected country legible even if this edition contains no records for it.
    ...(f.country !== 'all' && !countries.includes(f.country) ? [[f.country, COUNTRY_NAMES[f.country] || f.country] as const] : []),
  ];
  const filterLabels: Record<FilterKey, string> = {
    q: `Búsqueda: ${f.q}`,
    stage: `Etapa: ${optionLabel(stageOptions, f.stage)}`,
    country: `País: ${COUNTRY_NAMES[f.country] || f.country}`,
    field: `Área: ${f.field}`,
    kind: `Tipo: ${optionLabel(KIND_OPTIONS, f.kind)}`,
    status: `Vigencia: ${optionLabel(STATUS_OPTIONS, f.status)}`,
    subject: `Indicadores: ${subjectLabel}`,
    tier: `Tier: ${optionLabel(TIER_OPTIONS, f.tier)}`,
    funding: `Financiación: ${optionLabel(FUNDING_OPTIONS, f.funding)}`,
    language: `Idioma: ${optionLabel(LANGUAGE_OPTIONS, f.language)}`,
    closing: `Cierre: ${optionLabel(CLOSING_OPTIONS, f.closing)}`,
  };
  const activeFilters = (Object.keys(filterLabels) as FilterKey[]).filter(key => f[key] !== defaults[key]);
  const secondaryCount = (['stage', 'kind', 'language', 'closing'] as const)
    .filter(key => f[key] !== defaults[key]).length;
  const indicatorCount = Number(f.subject !== defaults.subject) + Number(f.tier !== defaults.tier);
  const startingSearches = funding ? FUNDING_SEARCHES : STARTING_SEARCHES;
  const incompatibleFundingType = funding && ['position', 'master-programme'].includes(f.kind);
  const returnQuery = filterQuery(f).toString();
  const returnHref = `${funding ? '/financiacion' : '/explorar'}${returnQuery ? '?' + returnQuery : ''}`;

  return (
    <main id="contenido" className="explorer-page explorer-workspace wrap">
      <header className="explorer-heading">
        <div>
          <h1>{funding ? 'Financiación académica' : 'Oportunidades académicas'}</h1>
          <p>{funding
            ? 'Encuentra ayudas y compara sus condiciones de acceso.'
            : 'Busca programas y vacantes. Compara condiciones e investigación por disciplina.'}</p>
        </div>
        <div className="explorer-edition">
          <span>Edición del catálogo: {data.generatedAt ? dateLabel(data.generatedAt) : error ? 'no disponible' : 'cargando…'}</span>
          <Link href="/fuentes">Cobertura y fuentes <ArrowUpRight size={14} aria-hidden="true"/></Link>
        </div>
      </header>

      <div className="explorer-search">
        <Search size={21} aria-hidden="true"/>
        <input
          type="search"
          aria-label={funding ? 'Buscar financiación' : 'Buscar oportunidades'}
          value={f.q}
          onChange={event => change('q', event.target.value)}
          placeholder="Tema, universidad o palabras clave"
          maxLength={200}
        />
        {f.q && <button type="button" aria-label="Borrar búsqueda" onClick={() => change('q', '')}><X size={18}/></button>}
      </div>

      <div className="explorer-starting-searches" aria-label="Búsquedas de partida">
        <span>Empezar por</span>
        <div>
          {startingSearches.map(search => {
            const preset = {...defaults, ...search.filters};
            const active = (Object.keys(defaults) as (keyof Filters)[])
              .every(key => key === 'page' || f[key] === preset[key]);
            return (
              <button key={search.label} type="button" aria-pressed={active} onClick={() => setF(preset)}>
                {search.label}
              </button>
            );
          })}
        </div>
      </div>

      <section className="explorer-filter-section" aria-label="Filtros de búsqueda">
        <button
          type="button"
          className="explorer-filter-toggle"
          aria-expanded={filtersOpen}
          aria-controls="explorer-filter-panel"
          onClick={() => setFiltersOpen(open => !open)}
        >
          <SlidersHorizontal size={18} aria-hidden="true"/>
          <span>{filtersOpen ? 'Cerrar filtros' : 'Filtros'}{activeFilters.length > 0 && ` · ${activeFilters.length} activos`}</span>
          <ChevronDown size={18} aria-hidden="true"/>
        </button>
        <div id="explorer-filter-panel" className="explorer-filter-panel" data-open={filtersOpen}>
          <div className="explorer-primary-filters">
            <Choice label="País" value={f.country} onChange={value => change('country', value)} options={countryOptions}/>
            <Choice label="Área del programa" value={f.field} onChange={value => change('field', value)} options={[
              ['all', 'Todas las áreas'], ...FIELDS.map(field => [field, field] as const),
            ]}/>
            <Choice label="Financiación" value={f.funding} onChange={value => change('funding', value)} options={FUNDING_OPTIONS}/>
            <Choice label="Vigencia" value={f.status} onChange={value => change('status', value)} options={STATUS_OPTIONS}/>
          </div>
          <div className="explorer-filter-groups">
            <details className="explorer-filter-group">
              <summary>Más filtros{secondaryCount > 0 && <span> · {secondaryCount} activos</span>}</summary>
              <div className="explorer-secondary-filters">
                <Choice label="Etapa académica" value={f.stage} onChange={value => change('stage', value)} options={stageOptions}/>
                {!funding && <Choice label="Tipo" value={f.kind} onChange={value => change('kind', value)} options={KIND_OPTIONS}/>}
                <Choice label="Idioma mencionado" value={f.language} onChange={value => change('language', value)} options={LANGUAGE_OPTIONS}/>
                <Choice label="Cierre en" value={f.closing} onChange={value => change('closing', value)} options={CLOSING_OPTIONS}/>
              </div>
              <p>El idioma es una mención en los requisitos; confirma si toda la docencia se imparte en él.</p>
            </details>
            <details className="explorer-filter-group explorer-indicators">
              <summary>Indicadores de investigación{indicatorCount > 0 && <span> · {indicatorCount} activos</span>}</summary>
              <div className="explorer-indicator-filters">
                <Choice label="Disciplina de los indicadores" value={f.subject} onChange={value => change('subject', value)} options={SUBJECTS}/>
                <Choice label="Tier investigador" value={f.tier} onChange={value => change('tier', value)} options={TIER_OPTIONS}/>
              </div>
              <p>
                El prestigio combina actividad e impacto en <strong>{subjectLabel}</strong>.
                {loaded && ` ${ranked.toLocaleString('es-ES')} de ${eligible.length.toLocaleString('es-ES')} registros de esta etapa tienen tier.`}
                {' '}La ausencia de datos no es una valoración baja. Al ordenar por indicadores, las fichas sin tier aparecen al final.
              </p>
              <Link href={'/instituciones?disciplina=' + f.subject + '#metodo-tiers'}>Método y fuentes de los indicadores <ArrowUpRight size={14} aria-hidden="true"/></Link>
            </details>
          </div>
          <button
            type="button"
            className="primary-button explorer-show-results"
            onClick={() => {
              pendingFilterFocus.current = true;
              setFiltersOpen(false);
            }}
          >
            {loaded ? `Ver ${filtered.length.toLocaleString('es-ES')} ${filtered.length === 1 ? 'resultado' : 'resultados'}` : 'Ver resultados'}
            <ArrowRight size={16} aria-hidden="true"/>
          </button>
        </div>
      </section>

      {activeFilters.length > 0 && (
        <div className="explorer-active-filters" aria-label="Filtros activos">
          <ul>
            {activeFilters.map(key => (
              <li key={key}>
                <button type="button" aria-label={'Quitar filtro: ' + filterLabels[key]} onClick={() => change(key, defaults[key])}>
                  <span>{filterLabels[key]}</span><X size={14} aria-hidden="true"/>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="explorer-reset" onClick={reset}>Limpiar filtros</button>
        </div>
      )}
      <p className="explorer-status-note">Un programa puede tener convocatorias anuales: aparecer aquí no implica que admita solicitudes hoy. Una ayuda condicionada no garantiza financiación.</p>
      {incompatibleFundingType && (
        <p className="notice">
          Esta búsqueda conserva un tipo de oportunidad de la URL que no corresponde al catálogo de ayudas.
          {' '}<button type="button" className="text-link" onClick={() => change('kind', 'all')}>Quitar el filtro de tipo</button>.
        </p>
      )}

      <div className="results-heading explorer-results-heading" ref={resultsHeading} tabIndex={-1} aria-label="Resultados de la búsqueda">
        <div>
          <p role="status" aria-live="polite"><strong>{loaded ? filtered.length.toLocaleString('es-ES') : '…'}</strong> {filtered.length === 1 ? 'resultado' : 'resultados'}</p>
          <p className="explorer-indicator-context">
            Indicadores: <strong>{subjectLabel}</strong> · <Link href={'/instituciones?disciplina=' + f.subject + '#metodo-tiers'}>Metodología</Link>
          </p>
        </div>
        <Choice label="Ordenar" value={f.sort} onChange={value => change('sort', value)} options={SORT_OPTIONS}/>
      </div>
      {error && <p className="notice" role="alert">
        No se ha podido cargar la edición.{loaded ? ' Se conservan los resultados anteriores.' : ''}
        {' '}<button className="text-link" onClick={() => void refresh(true)} disabled={refreshing}>{refreshing ? 'Reintentando…' : 'Reintentar'}</button>
      </p>}
      {!loaded && !error && <p className="loading-results" role="status">Cargando el índice de oportunidades…</p>}
      {detailErrors.length > 0 && <p className="notice" role="alert">
        Algunas condiciones no se pudieron cargar. Las demás fichas siguen disponibles.
        {' '}<button className="text-link" disabled={detailsLoading} onClick={() => setDetailRevision(value => value + 1)}>{detailsLoading ? 'Reintentando…' : 'Reintentar condiciones'}</button>
        {' '}También puedes abrir la ficha completa.
      </p>}
      {loaded && (filtered.length ? (
        <div className="opportunity-grid">
          {visible.map(record => (
            <OpportunityCard
              key={record.id}
              record={details[record.detailPath] || {...record, entry: '', funding: {...record.funding, text: ''}}}
              loading={!details[record.detailPath]}
              unavailable={detailErrors.includes(record.detailPath)}
              research={record.researchInstitutionId ? data.institutions[record.researchInstitutionId] : undefined}
              subject={f.subject}
              selected={compare.includes(record.id)}
              onCompare={toggle}
              compareDisabled={!compare.includes(record.id) && (!details[record.detailPath] || compare.length >= 3)}
              returnHref={returnHref}
            />
          ))}
        </div>
      ) : (
        <div className="empty-results">
          <Search size={32} aria-hidden="true"/>
          <h2>No hay coincidencias con estos filtros.</h2>
          <p>Amplía los tiers, países o condiciones. Que no aparezca aquí no implica que la oportunidad no exista.</p>
          <button className="primary-button" onClick={reset}>Ampliar la búsqueda</button>
        </div>
      ))}
      {loaded && pages > 1 && (
        <nav className="results-pagination" aria-label="Páginas de resultados">
          <button disabled={page === 1} onClick={() => goToPage(page - 1)}>Anterior</button>
          <span>Página {page} de {pages}</span>
          <button disabled={page === pages} onClick={() => goToPage(page + 1)}>Siguiente <ArrowRight size={16}/></button>
        </nav>
      )}
      <div className="catalogue-footnote">
        <p>Cada filtro queda guardado en la dirección de la página. Actualizar consulta descarga la última edición publicada.</p>
        <button onClick={() => void refresh(true)} disabled={refreshing}><RefreshCw size={14} className={refreshing ? 'spin' : ''}/>{refreshing ? 'Actualizando…' : 'Actualizar consulta'}</button>
      </div>
      {compare.length > 0 && <div className="compare-tray">
        <Scale size={21}/><span>{compare.length} de 3 seleccionadas</span>
        <button ref={comparisonButton} className="primary-button" onClick={() => setDialog(true)} disabled={selected.length < 2}>Comparar condiciones</button>
        <button aria-label="Vaciar comparación" onClick={() => setCompare([])}><X size={20}/></button>
      </div>}
      {dialog && <Suspense fallback={<p role="status">Abriendo comparación…</p>}>
        <Comparison selected={selected} onClose={closeComparison} onRestoreFocus={() => comparisonButton.current?.focus()} returnHref={returnHref}/>
      </Suspense>}
    </main>
  );
}
