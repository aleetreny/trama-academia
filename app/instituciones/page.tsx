import Institutions from '@/components/institutions';
import data from '@/.web-generated/metadata.json';
import type {InstitutionMetadata} from '@/lib/institutions';
export const metadata={title:'Instituciones y fortaleza investigadora por disciplina'};
export default function Page(){return <Institutions registry={data.registry as InstitutionMetadata} counts={data.countryCounts}/>;}
