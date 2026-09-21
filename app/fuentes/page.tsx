import Sources from '@/components/sources';
import data from '@/.web-generated/metadata.json';
export const metadata={title:'Fuentes y cobertura'};
export default function Page(){return <Sources data={{generatedAt:data.generatedAt,records:data.records,openRecords:data.openRecords,countries:data.countries,activeSources:data.activeSources,partialSources:data.partialSources}}/>;}
