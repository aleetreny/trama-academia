import type {Catalogue} from './types';

export type ExplorerCatalogue=Pick<Catalogue,'generatedAt'|'records'|'mode'>;

// Evidence and audit reports belong to detail/source pages. Serializing thousands
// of those nested objects through RSC can exhaust the Worker's CPU budget.
export function explorerCatalogue(data:Catalogue,funding=false):ExplorerCatalogue{
 return {
  generatedAt:data.generatedAt,...(data.mode?{mode:data.mode}:{}),
  records:data.records.filter(r=>r.kind.includes('funding')===funding).map(record=>{
   const {evidence,researchNote,eligibilityNote,geography,...listing}=record;
   void evidence;void researchNote;void eligibilityNote;void geography;
   return listing;
  }),
 };
}
