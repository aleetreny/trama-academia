// Missing or ambiguous identities never inherit a partner institution's tier.
export const normalise=s=>String(s||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const host=url=>{try{return new URL(url).hostname.toLowerCase().replace(/^www\./,'');}catch{return '';}};
export function createInstitutionMatcher(institutions){
 const names=new Map(),domains=new Map();
 const add=(map,key,i)=>{if(!key)return;const rows=map.get(key)||new Map();rows.set(i.id,i);map.set(key,rows);};
 for(const i of institutions){for(const name of [i.name,...i.aliases||[]])add(names,i.country+'|'+normalise(name),i);for(const domain of [...i.domains||[],host(i.officialUrl)])add(domains,domain,i);}
 return record=>{
  const exact=names.get(record.country+'|'+normalise(record.institution));
  if(exact?.size===1)return {institution:[...exact.values()][0],method:'name-country'};
  if(exact?.size>1)return null;
  if(/(?:\s[—–/·]\s|\s&\s|consortium|consorcio)/i.test(record.institution))return null;
  let domain=host(record.url);
  while(domain.includes('.')){
   const candidates=[...(domains.get(domain)?.values()||[])].filter(i=>i.country===record.country);
   if(candidates.length===1)return {institution:candidates[0],method:'official-domain-country'};
   if(candidates.length>1)return null;
   domain=domain.slice(domain.indexOf('.')+1);
  }
  return null;
 };
}
