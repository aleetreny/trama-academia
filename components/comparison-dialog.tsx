'use client';
import type {ReactNode} from 'react';
import Link from './site-link';
import {X} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from './ui/dialog';
import {TableHeader,TableBody,TableRow,TableHead,TableCell} from './ui/table';
import {destinationLabel,funderCountryLabel,dateLabel,statusOf,STATUS_NAMES,type Opportunity} from '@/lib/types';
import {opportunityHref} from '@/lib/return-path';
const rows:[string,(record:Opportunity)=>ReactNode][]=[
 ['Destino',r=>destinationLabel(r)],
 ['País de la entidad financiadora',r=>r.funderCountry?funderCountryLabel(r.funderCountry):'No documentado'],
 ['Vigencia',r=>STATUS_NAMES[statusOf(r)]],
 ['Nivel de entrada',r=>r.entry],
 ['Financiación',r=>r.funding.text],
 ['Duración',r=>r.duration||'Por confirmar'],
 ['Contrato',r=>r.contract||'No confirmado'],
 ['Matrícula',r=>r.feeNote||'Consultar la fuente'],
 ['Cierre',r=>r.deadline?dateLabel(r.deadline):r.recurrence?'Consultar calendario de la edición':'Consultar convocatoria'],
 ['Calendario de la edición',r=>r.recurrence?.calendar||'Consultar convocatoria'],
 ['Comprobado',r=>dateLabel(r.verifiedAt)],
 ['Fuente oficial',r=><a href={r.url} target="_blank" rel="noreferrer">Consultar condiciones ↗</a>],
];
export default function Comparison({selected,onClose,onRestoreFocus,returnHref}:{selected:Opportunity[];onClose:()=>void;onRestoreFocus:()=>void;returnHref?:string}){
 return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent className="comparison-dialog" showCloseButton={false} onCloseAutoFocus={event=>{event.preventDefault();onRestoreFocus();}}>
  <DialogClose className="dialog-close" aria-label="Cerrar comparación"><X/></DialogClose>
  <DialogTitle>Las condiciones, una junto a otra.</DialogTitle>
  <DialogDescription>Los importes conservan su moneda y periodo originales; bruto y neto no son equivalentes. Comprueba la vigencia y los requisitos en la fuente oficial.</DialogDescription>
  <p className="mobile-table-hint">Desliza la tabla para comparar todas las columnas. Con teclado, enfoca la tabla y usa las flechas.</p>
  <div className="comparison-table-scroll" role="region" aria-label="Condiciones de las oportunidades seleccionadas" tabIndex={0}>
   <table><TableHeader><TableRow><TableHead scope="col">Condición</TableHead>{selected.map(r=><TableHead scope="col" key={r.id}>{r.institution}<Link href={opportunityHref(r.id,returnHref)}>{r.title}</Link></TableHead>)}</TableRow></TableHeader>
    <TableBody>{rows.map(([name,value])=><TableRow key={name}><TableHead scope="row">{name}</TableHead>{selected.map(r=><TableCell key={r.id}>{value(r)}</TableCell>)}</TableRow>)}</TableBody>
   </table>
  </div>
 </DialogContent></Dialog>;
}
