export const BASE_PATH=process.env.NEXT_PUBLIC_BASE_PATH||'';
export function sitePath(href:string){
 if(!href.startsWith('/')||href.startsWith('//')||BASE_PATH&&href.startsWith(BASE_PATH+'/'))return href;
 const cut=href.search(/[?#]/),pathname=cut<0?href:href.slice(0,cut),suffix=cut<0?'':href.slice(cut);
 return BASE_PATH+pathname+(pathname.endsWith('/')||/\.[^/]+$/.test(pathname)?'':'/')+suffix;
}
export const assetPath=(path:string)=>BASE_PATH+'/'+path.replace(/^\//,'');
