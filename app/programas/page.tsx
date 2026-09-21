import {PathContext} from '@/components/doctoral-path';
import Link from '@/components/site-link';
import RecurringProgrammes from '@/components/recurring-programmes';
import {getCatalogue} from '@/lib/catalogue';
import type {RecurringRecord} from '@/lib/recurrence';

export const metadata={title:'Programas recurrentes: escuelas de verano, estancias y becas',description:'Planifica escuelas de verano, estancias de investigación y becas con ediciones documentadas. Fechas de referencia, requisitos y fuentes oficiales.'};

export default async function Page(){
 const catalogue=await getCatalogue();
 const programmes:RecurringRecord[]=catalogue.records.flatMap(record=>record.recurrence?[{id:record.id,title:record.title,institution:record.institution,country:record.country,destinationCountries:record.destinationCountries,url:record.url,stage:record.stage,eligibleStages:record.eligibleStages,entry:record.entry,verifiedAt:record.verifiedAt,lastError:record.lastError,recurrence:record.recurrence}]:[]);
 return <main id="contenido" className="recurring-page wrap">
  <header className="page-intro"><p className="eyebrow">PREPARA LA SIGUIENTE CONVOCATORIA</p><h1>Programas a los que volver.</h1><p>Prueba cómo se investiga, aprende un método o conoce un grupo. Escuelas de verano, estancias y becas en España y Europa para planificar incluso cuando las solicitudes están cerradas.</p></header>
  <PathContext/><nav className="guide-jump" aria-label="En esta página"><a href="#programas-filtros">Buscar programas</a><a href="#preparar-programa">Preparar la solicitud</a></nav>
  <div className="recurring-context"><p><strong>La edición importa.</strong> Las fechas y condiciones corresponden a la edición indicada. Confirma cuándo abrirá la próxima convocatoria.</p><p><strong>Elige qué necesitas aprender.</strong> Una escuela ofrece formación y contacto con investigadores; una estancia, trabajo en un proyecto. Consulta requisitos, costes y ayudas.</p></div>
  <p className="recurring-guide-link"><Link className="text-link" href="/doctorado-en-espana#experiencia">Cómo elegir una experiencia que aporte a tu perfil ↗</Link> · <Link className="text-link" href="/programas?pais=ES">Ver programas con destino España ↗</Link></p>
  <RecurringProgrammes records={programmes}/>
  <section className="recurring-plan" id="preparar-programa"><h2>Antes de que abra la solicitud</h2><ol><li>Comprueba el nivel de estudios, el país de matrícula y las restricciones de residencia o nacionalidad.</li><li>Prepara expediente, CV y referencias. Algunas estancias seleccionan en invierno para el verano siguiente.</li><li>Calcula matrícula, viaje, alojamiento y visado. Una ayuda competitiva solo cubre lo que indique su concesión.</li><li>Confirma el nuevo calendario y las condiciones directamente con el organizador antes de solicitar.</li></ol><p>Esta selección no agota todas las opciones. También puedes <Link href="/explorar">explorar el catálogo completo</Link> o <Link href="/financiacion">buscar otras ayudas</Link>.</p></section>
 </main>;
}
