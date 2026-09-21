'use client';
import {useEffect,useState} from 'react';
import {statusOf,STATUS_NAMES,type Opportunity} from '@/lib/types';
type StatusRecord=Pick<Opportunity,'kind'|'status'|'verifiedAt'|'deadline'|'lastError'>;
export function OpportunityStatus({record,initialStatus,notice=false}:{record:StatusRecord;initialStatus:string;notice?:boolean}){
 const [status,setStatus]=useState(initialStatus);
 useEffect(()=>{const update=()=>setStatus(statusOf(record));update();const timer=setInterval(update,60000);return()=>clearInterval(timer);},[record]);
 if(notice)return status==='closed'?<p className="notice">El plazo registrado ha terminado. Consulta si existe una nueva convocatoria.</p>:null;
 return <span className={'status-label status-'+status}>{STATUS_NAMES[status]}</span>;
}
