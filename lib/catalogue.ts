import snapshot from '@/data/catalogue.json';
import type {Catalogue} from './types';
// The verified edition is rendered at build time; visits never query Neon.
export async function getCatalogue():Promise<Catalogue>{return {...snapshot,mode:'snapshot'} as Catalogue;}
