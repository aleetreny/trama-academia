import {getCatalogue} from '@/lib/catalogue';
export const dynamic='force-static';
export async function GET(){return Response.json(await getCatalogue(),{headers:{'Cache-Control':'public, max-age=0, s-maxage=60, stale-while-revalidate=120'}});}
