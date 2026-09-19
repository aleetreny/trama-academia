import {neon} from '@neondatabase/serverless';
import {randomBytes} from 'node:crypto';
import fs from 'node:fs/promises';
const sql=neon(process.env.DATABASE_URL);
const existing=await sql`SELECT 1 FROM pg_roles WHERE rolname='trama_reader'`;
if(existing.length){console.log('Reader already provisioned; existing credential preserved');process.exit(0);}
const password=randomBytes(32).toString('hex');
await sql.query('CREATE ROLE trama_reader LOGIN PASSWORD \''+password+'\'');
await sql.query('GRANT CONNECT ON DATABASE trama TO trama_reader');
await sql.query('GRANT USAGE ON SCHEMA public TO trama_reader');
await sql.query('GRANT SELECT ON opportunities,sources,crawl_runs TO trama_reader');
const url=new URL(process.env.DATABASE_URL);url.username='trama_reader';url.password=password;
await fs.writeFile('.env.runtime','DATABASE_URL='+url.toString()+'\n',{mode:0o600});
await fs.writeFile('.dev.vars','DATABASE_URL='+url.toString()+'\n',{mode:0o600});
console.log('Read-only application credential provisioned');
