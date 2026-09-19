import {drizzle} from 'drizzle-orm/neon-http';
import {migrate} from 'drizzle-orm/neon-http/migrator';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL required');
const url=new URL(process.env.DATABASE_URL);url.hostname=url.hostname.replace('-pooler.','.');
const db=drizzle(url.toString());
await migrate(db,{migrationsFolder:'./db/migrations'});
console.log('Schema migration complete');
