import {drizzle} from 'drizzle-orm/neon-http';
import {migrate} from 'drizzle-orm/neon-http/migrator';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL required');
const db=drizzle(process.env.DATABASE_URL);
await migrate(db,{migrationsFolder:'./db/migrations'});
console.log('Schema migration complete');
