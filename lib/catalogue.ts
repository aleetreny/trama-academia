import snapshot from '@/data/catalogue.json';
import type {Catalogue} from './types';
// The verified edition is rendered at build time; visits never query Neon.
export async function getCatalogue():Promise<Catalogue>{return {...snapshot,mode:'snapshot'} as Catalogue;}

// Capture time with the server data read, once for all deadline calculations.
export async function getTimedCatalogue(){return {data:await getCatalogue(),now:Date.now()};}
