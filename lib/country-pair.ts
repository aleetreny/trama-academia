export function countryPair(params:URLSearchParams,codes:readonly string[]):[string,string]{
 const valid=(value:string|null,fallback:string)=>value&&codes.includes(value)?value:fallback;
 const left=valid(params.get('pais1'),'ES'),right=valid(params.get('pais2'),'GB');
 return [left,right===left?(codes.find(c=>c!==left)||left):right];
}
