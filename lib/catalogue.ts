import {desc,ne} from 'drizzle-orm';
import {getDb} from '@/db';
import {opportunities,sources,runs} from '@/db/schema';
import snapshot from '@/data/catalogue.json';
import type {Catalogue,Opportunity,Source} from './types';
export async function getCatalogue():Promise<Catalogue>{
 try{const db=getDb();const [records,sourceRows,lastRun]=await Promise.all([db.select({payload:opportunities.payload}).from(opportunities).where(ne(opportunities.status,'excluded')),db.select({payload:sources.payload}).from(sources).where(ne(sources.status,'retired')),db.select().from(runs).orderBy(desc(runs.finishedAt)).limit(1)]);
  if(!records.length)throw new Error('empty_database');return {generatedAt:lastRun[0]?.finishedAt?.toISOString()||null,records:records.map(r=>r.payload as Opportunity),sources:sourceRows.map(r=>r.payload as Source),run:(lastRun[0]?.report||null) as Catalogue['run'],mode:'live'};
 }catch{ return {...snapshot,mode:'snapshot'} as Catalogue; }
}
