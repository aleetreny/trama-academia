import Explorer from '@/components/explorer';
import {getCatalogue} from '@/lib/catalogue';
import {explorerCatalogue} from '@/lib/explorer-data';
import {STAGES} from '@/lib/types';
export const metadata={title:'Becas y financiación'};
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{etapa?:string;q?:string}>}){const p=await searchParams;return <Explorer funding initial={JSON.stringify(explorerCatalogue(await getCatalogue(),true))} initialStage={STAGES.some(s=>s.id===p.etapa)?p.etapa:'all'} initialQuery={typeof p.q==='string'?p.q:''}/>;}
