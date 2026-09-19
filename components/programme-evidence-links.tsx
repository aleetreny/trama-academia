import {ArrowUpRight} from 'lucide-react';
import type {Opportunity} from '@/lib/types';

export function ProgrammeEvidenceLinks({record}:{record:Opportunity}){
 const references=record.evidence?.references?.filter(reference=>reference.url!==record.evidence?.checkedUrl&&reference.url!==record.evidence?.researchUrl)||[];
 if(!references.length)return null;
 return <div className="programme-evidence-links"><h3>Documentación del programa</h3><ul>{references.map(reference=><li key={reference.url}><a href={reference.url} target="_blank" rel="noreferrer">{reference.label}<ArrowUpRight size={15}/></a></li>)}</ul></div>;
}
