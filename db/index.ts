import {env} from 'cloudflare:workers';
import {drizzle} from 'drizzle-orm/neon-http';
import {neon} from '@neondatabase/serverless';
import * as schema from './schema';
export function getDb(){const url=(env as unknown as {DATABASE_URL?:string}).DATABASE_URL;if(!url)throw new Error('Database connection unavailable');const client=neon(url,{fetchOptions:{signal:AbortSignal.timeout(8000)}});return drizzle(client,{schema});}
