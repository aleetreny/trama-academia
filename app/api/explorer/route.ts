import {getCatalogue} from '@/lib/catalogue';
import {explorerCatalogue} from '@/lib/explorer-data';
export const dynamic='force-static';
// Legacy data export. The interactive search uses versioned compact indexes.
export async function GET(){return Response.json(explorerCatalogue(await getCatalogue()));}
