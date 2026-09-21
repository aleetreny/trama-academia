import {notFound} from 'next/navigation';
import Link from '@/components/site-link';
import {countryGuides,GUIDE_ROWS} from '@/data/country-guides';
import {dateLabel} from '@/lib/types';
export const dynamicParams=false;
export function generateStaticParams(){return countryGuides.map(c=>({pais:c.code.toLowerCase()}));}
export async function generateMetadata({params}:{params:Promise<{pais:string}>}){const {pais}=await params;const c=countryGuides.find(c=>c.code.toLowerCase()===pais);return {title:c?'Doctorado en '+c.name+': acceso, financiación y condiciones':'Guía no encontrada'};}
export default async function Page({params}:{params:Promise<{pais:string}>}){
 const {pais}=await params,c=countryGuides.find(c=>c.code.toLowerCase()===pais);if(!c)notFound();
 return <main id="contenido" className="guide-page country-page wrap"><Link className="back-link" href="/guia#paises">← Todas las guías de doctorado</Link><div className="page-heading"><div><p className="eyebrow">GUÍA DEL DOCTORADO · {c.code}</p><h1>Investigar en {c.name}.</h1><p>{c.scope}</p></div></div><p className="guide-date">Revisión editorial: {dateLabel(c.checkedAt)}. Consulta debajo la fecha y el alcance de cada fuente.</p>
 <nav className="guide-jump" aria-label="En esta guía">{GUIDE_ROWS.map(([key,label])=><a key={key} href={'#'+key}>{label}</a>)}<a href="#fuentes">Fuentes</a></nav>
 <div className="country-reading">{GUIDE_ROWS.map(([key,label])=><section className="guide-section" id={key} key={key}><h2>{label}</h2><p>{c.facts[key]}</p>{key!=='watch'&&<p className="fact-source">Referencia: {(c.factSources[key]||[1]).map((n,i)=><span key={n}>{i>0?' · ':''}<a href={'#fuente-'+n}>{c.sources[n-1].title}</a></span>)}</p>}</section>)}</div>
 <section id="fuentes" className="guide-section"><p className="eyebrow">FUENTES Y ALCANCE</p><h2>De dónde sale la información.</h2><ol className="guide-source-list">{c.sources.map((s,i)=><li key={s.url} id={'fuente-'+(i+1)}><a href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a><p>{s.scope}. Consultada: {dateLabel(s.checkedAt)}.</p><p>Fecha que declara la fuente: {s.sourceUpdated||'no identificada en la página consultada'}.</p>{s.accessNote&&<p>{s.accessNote}</p>}</li>)}</ol><p className="small muted">Las preguntas sobre costes o condiciones que no se han confirmado se mantienen abiertas. Antes de solicitar, contrasta esta orientación con el reglamento, la convocatoria y la oferta individual vigentes.</p></section>
 <div className="guide-actions"><Link className="primary-button" href={'/explorar?etapa=doctorado&pais='+c.code}>Ver doctorados en {c.name} ↗</Link><Link className="text-link" href={'/guia?pais1='+c.code+'&pais2='+(c.code==='GB'?'ES':'GB')+'#comparar'}>Comparar con otro país ↗</Link><Link className="text-link" href="/guia#preparar">Preparar la candidatura ↗</Link></div></main>;
}
