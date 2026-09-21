'use client';
import {useEffect,useState} from 'react';
import Link from '@/components/site-link';
import {ArrowUpRight} from 'lucide-react';
import {countryGuides,GUIDE_ROWS,GUIDE_VERIFIED} from '@/data/country-guides';
import {countryPair} from '@/lib/country-pair';
import {dateLabel} from '@/lib/types';
const codes=countryGuides.map(c=>c.code);
export default function CountryComparison(){
 const [pair,setPair]=useState<[string,string]>(['ES','GB']),[ready,setReady]=useState(false);
 useEffect(()=>{const sync=()=>{setPair(countryPair(new URLSearchParams(location.search),codes));setReady(true);};sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[]);
 useEffect(()=>{if(!ready)return;const url=new URL(location.href);url.searchParams.set('pais1',pair[0]);url.searchParams.set('pais2',pair[1]);history.replaceState(null,'',url);},[pair,ready]);
 const choices=pair.map(code=>countryGuides.find(c=>c.code===code)!);
 const change=(index:number,value:string)=>setPair(previous=>{const next:[string,string]=[...previous];next[index]=value;if(next[1-index]===value)next[1-index]=previous[index];return next;});
 return <><div className="country-pickers">{choices.map((c,index)=><label className="filter-choice" key={index}><span>{index===0?'Primer país':'Segundo país'}</span><select value={c.code} onChange={e=>change(index,e.target.value)}>{countryGuides.map(option=><option value={option.code} key={option.code}>{option.name}</option>)}</select></label>)}</div>
 <p className="small muted">La selección se guarda en la dirección: puedes copiarla para volver a esta comparación.</p>
 <div className="country-duo">{choices.map(c=><div key={c.code}><span className="country-code">{c.code}</span><h3>{c.name}</h3><p>{c.scope}</p><Link className="text-link" href={'/guia/'+c.code.toLowerCase()}>Guía y fuentes de {c.name} <ArrowUpRight size={16}/></Link></div>)}</div>
 <div className="country-facts" aria-label={`Comparación entre ${choices[0].name} y ${choices[1].name}`}>{GUIDE_ROWS.map(([key,title])=><section className="country-fact" key={key}><h3>{title}</h3><div>{choices.map(c=><div key={c.code}><strong className="comparison-country">{c.name}</strong><p>{c.facts[key]}</p><Link className="fact-source" href={'/guia/'+c.code.toLowerCase()+'#'+key}>Ver contexto y fuentes</Link></div>)}</div></section>)}</div>
 <p className="guide-date">Revisión editorial: {dateLabel(GUIDE_VERIFIED)}. Las fuentes tienen fechas distintas; consulta su alcance y antigüedad en cada guía.</p>
 <div className="guide-actions"><Link href="/explorar?etapa=doctorado" className="primary-button">Explorar doctorados <ArrowUpRight size={17}/></Link><Link href="/financiacion?etapa=doctorado" className="text-link">Buscar financiación doctoral <ArrowUpRight size={17}/></Link></div></>;
}
