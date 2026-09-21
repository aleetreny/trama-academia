import Link from '@/components/site-link';
import {ArrowUpRight} from 'lucide-react';
import {spainDoctoralGuide as guide,type SpainDoctoralGuideBlock} from '@/data/spain-doctoral-guide';
import {dateLabel} from '@/lib/types';
import './guide.css';
export const metadata={title:'Doctorado desde España: acceso, experiencia, grupos y financiación',description:guide.description};
const sectionActions:Record<string,[string,string]>={master:['/explorar?etapa=master&tipo=master-programme&pais=ES','Buscar másteres con investigación en España'],experiencia:['/programas?pais=ES','Explorar estancias y escuelas en España'],grupo:['/instituciones?pais=ES','Localizar instituciones en tu disciplina'],financiacion:['/financiacion?etapa=doctorado&pais=ES','Consultar ayudas doctorales con destino España'],candidatura:['/seleccion','Preparar mi lista corta de oportunidades']};
function Block({block}:{block:SpainDoctoralGuideBlock}){
  let content;
  switch(block.kind){
    case 'paragraph':content=<p>{block.text}</p>;break;
    case 'callout':content=<aside className={'spain-callout '+block.tone}><h3>{block.title}</h3><p>{block.text}</p></aside>;break;
    case 'table':content=<div className="spain-table" role="region" aria-label={block.title||'Comparación de opciones'} tabIndex={0}><table>{block.title&&<caption>{block.title}</caption>}<thead><tr>{block.columns.map(column=><th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{block.rows.map((row,index)=><tr key={index}>{row.map((cell,i)=>i===0?<th scope="row" key={i}>{cell}</th>:<td key={i}>{cell}</td>)}</tr>)}</tbody></table></div>;break;
    case 'template':content=<div className="spain-template"><h3>{block.title}</h3><p>Ejemplo para adaptar a tu experiencia y al trabajo del grupo.</p><pre>{block.text}</pre></div>;break;
    case 'checklist':content=<div className="spain-checklist">{block.title&&<h3>{block.title}</h3>}<ul>{block.items.map(item=><li key={item}>{item}</li>)}</ul></div>;break;
    case 'list':content=<>{block.title&&<h3>{block.title}</h3>}{block.ordered?<ol>{block.items.map(item=><li key={item}>{item}</li>)}</ol>:<ul>{block.items.map(item=><li key={item}>{item}</li>)}</ul>}</>;break;
  }
  return <div className="spain-block">{content}{(block.editorial||block.sourceIds?.length)&&<p className="spain-evidence">{block.editorial&&<span>Orientación de TRAMA{block.sourceIds?.length?' · Contexto: ':''}</span>}{block.sourceIds?.map(id=>{const source=guide.sources.find(item=>item.id===id)!;return <a key={id} href={'#fuente-'+id}>{source.publisher} ↗</a>;})}</p>}</div>;
}
export default function Page(){return <main id="contenido" className="spain-guide wrap">
  <header className="page-heading"><div><p className="eyebrow">UNA GUÍA PARA DECIDIR Y PREPARARTE</p><h1>El doctorado,<br/>desde donde estás.</h1><p>{guide.description}</p></div><Link className="primary-button" href="/mi-camino">Convertirlo en mi plan <ArrowUpRight size={17}/></Link></header>
  <p className="spain-scope">{guide.scope}</p><p className="spain-reviewed">Revisión editorial y consulta: {dateLabel(guide.reviewedAt)}. Cada fuente indica su ámbito y, cuando consta, su fecha propia.</p>
  <div className="spain-layout"><nav className="spain-toc" aria-label="Índice de la guía"><p className="eyebrow">EN ESTA GUÍA</p>{guide.sections.map(section=><a key={section.id} href={'#'+section.id}>{section.title.replace(/^\d+\. /,'')}</a>)}<a href="#fuentes">Fuentes oficiales y alcance</a><Link href="/guia">Comparar con otros países ↗</Link></nav>
  <div className="spain-sections">{guide.sections.map(section=><section key={section.id} id={section.id}><h2>{section.title}</h2><p className="spain-summary">{section.summary}</p>{section.blocks.map((block,index)=><Block key={index} block={block}/>)}{sectionActions[section.id]&&<Link className="text-link" href={sectionActions[section.id][0]}>{sectionActions[section.id][1]} ↗</Link>}</section>)}
    <section id="fuentes" className="spain-sources"><h2>Fuentes oficiales y alcance</h2><p>Las reglas estatales, los ejemplos de una universidad y las condiciones de una edición tienen ámbitos distintos. Las pautas de preparación y los ejemplos de TRAMA están señalados como orientación.</p>{guide.sources.map(source=><article key={source.id} id={'fuente-'+source.id}><h3><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></h3><p className="spain-source-publisher">{source.publisher}</p><p>{source.scope}</p><p className="spain-source-date">Consulta: {dateLabel(source.checkedAt)}{source.sourceDate?' · '+source.sourceDate:'. Fecha propia no indicada en esta referencia.'}</p></article>)}</section>
    <div className="spain-end"><h2>Una primera acción concreta.</h2><p>Convierte lo que has leído en una lista de pasos y busca oportunidades que puedas contrastar.</p><Link className="primary-button" href="/mi-camino">Preparar mi camino <ArrowUpRight size={17}/></Link><Link className="text-link" href="/explorar?pais=ES">Explorar oportunidades en España ↗</Link></div>
  </div></div>
</main>;}
