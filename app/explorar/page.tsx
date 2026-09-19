import Explorer from '@/components/explorer';
import {getCatalogue} from '@/lib/catalogue';
import {STAGES} from '@/lib/types';
export const metadata={title:'Explorar oportunidades'};
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{etapa?:string;q?:string}>}){const p=await searchParams;return <Explorer initial={await getCatalogue()} initialStage={STAGES.some(s=>s.id===p.etapa)?p.etapa:'all'} initialQuery={typeof p.q==='string'?p.q:''}/>;}
