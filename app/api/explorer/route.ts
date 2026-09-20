import {getCatalogue} from '@/lib/catalogue';
import {explorerCatalogue} from '@/lib/explorer-data';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const funding=new URL(request.url).searchParams.get('funding')==='1';
 return Response.json(explorerCatalogue(await getCatalogue(),funding),{headers:{'Cache-Control':'public, max-age=0, s-maxage=60, stale-while-revalidate=120'}});
}
