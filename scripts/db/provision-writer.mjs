import {neon} from '@neondatabase/serverless';
import {randomBytes} from 'node:crypto';
import fs from 'node:fs/promises';
const sql=neon(process.env.DATABASE_URL);
const exists=await sql`SELECT 1 FROM pg_roles WHERE rolname='trama_writer'`;
if(exists.length){console.log('Writer already exists; credential preserved');process.exit(0);}
const password=randomBytes(32).toString('hex');
await sql.query("CREATE ROLE trama_writer LOGIN PASSWORD '"+password+"'");
await sql.query('GRANT CONNECT ON DATABASE trama TO trama_writer');
await sql.query('GRANT USAGE ON SCHEMA public TO trama_writer');
await sql.query('GRANT SELECT,INSERT,UPDATE ON opportunities,sources,crawl_runs,observations TO trama_writer');
const url=new URL(process.env.DATABASE_URL);url.username='trama_writer';url.password=password;
await fs.writeFile('.env.writer','DATABASE_URL='+url.toString()+'\n',{mode:0o600});
console.log('Catalogue writer created with SELECT, INSERT and UPDATE only');
