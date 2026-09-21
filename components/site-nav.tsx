'use client';
import {usePathname} from 'next/navigation';
import Link from './site-link';
import {BASE_PATH} from '@/lib/site-path';
const items=[['/#recorrido','Tu recorrido'],['/explorar','Explorar'],['/financiacion','Financiación'],['/programas','Programas recurrentes'],['/guia','Guías de doctorado'],['/instituciones','Instituciones']];
export function SiteNav(){const raw=usePathname();const path=BASE_PATH&&raw.startsWith(BASE_PATH+'/')?raw.slice(BASE_PATH.length):raw;return <nav aria-label="Principal">{items.map(([href,label])=><Link key={href} href={href} aria-current={!href.includes('#')&&(path===href||path.startsWith(href+'/'))?'page':undefined}>{label}</Link>)}</nav>;}
