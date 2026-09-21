'use client';
import {usePathname} from 'next/navigation';
import Link from './site-link';
import {BASE_PATH} from '@/lib/site-path';
import {SavedSelectionCount} from './saved-opportunities';
const items=[['/mi-camino','Mi camino'],['/doctorado-en-espana','Guía desde España'],['/explorar','Oportunidades'],['/financiacion','Financiación'],['/seleccion','Mi selección']];
export function SiteNav(){const raw=usePathname();const path=BASE_PATH&&raw.startsWith(BASE_PATH+'/')?raw.slice(BASE_PATH.length):raw;return <nav aria-label="Principal">{items.map(([href,label])=><Link key={href} href={href} aria-current={(path===href||path.startsWith(href+'/'))?'page':undefined}>{label}{href==='/seleccion'&&<SavedSelectionCount/>}</Link>)}</nav>;}
