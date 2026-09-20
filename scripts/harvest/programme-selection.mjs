import {canonicalUrl} from './domain.mjs';
export function selectProgrammeSeeds(allSeeds,selection){
 if(selection===undefined)return allSeeds;
 if(!Array.isArray(selection)||!selection.length)throw new Error('empty_programme_selection');
 const requested=new Set(selection.map(value=>canonicalUrl(typeof value==='string'?value:value.url)));
 const known=new Set(allSeeds.map(seed=>canonicalUrl(seed.url)));
 for(const url of requested)if(!known.has(url))throw new Error('unknown_programme_selection: '+url);
 // The selector supplies identities only. The reviewed central seed remains the
 // sole source of programme facts, even if a draft contains different metadata.
 return allSeeds.filter(seed=>requested.has(canonicalUrl(seed.url)));
}
