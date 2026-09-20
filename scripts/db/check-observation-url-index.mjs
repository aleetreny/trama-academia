import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {neon} from '@neondatabase/serverless';

if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL required');
const sql=neon(process.env.DATABASE_URL);
// Realistic long, high-entropy query strings cannot fit a B-tree text key.
// Clone the actual table's indexes into a temporary table; no production rows
// or schema objects are changed, and the probe disappears with the transaction.
const first='https://example.org/research?selection='+randomBytes(8000).toString('hex');
const second=first+'&page=2';
const result=await sql.transaction([
 sql`CREATE TEMP TABLE trama_observation_url_probe (LIKE observations INCLUDING ALL) ON COMMIT DROP`,
 sql`INSERT INTO trama_observation_url_probe (id,run_id,url,checked_at,outcome) VALUES ('probe-1','probe',${first},now(),'ok'),('probe-2','probe',${second},now(),'ok')`,
 sql`SELECT id,url FROM trama_observation_url_probe ORDER BY id`,
 sql`SELECT count(*)::int AS count FROM trama_observation_url_probe WHERE md5(url)=md5(${first}) AND url=${first}`,
]);
assert.deepEqual(result[2],[{id:'probe-1',url:first},{id:'probe-2',url:second}]);
assert.equal(result[3][0].count,1);
console.log(JSON.stringify({longUrlRoundTrip:true,distinctUrlsPreserved:true,fullUrlEquality:true,bytes:[Buffer.byteLength(first),Buffer.byteLength(second)],persistentRowsChanged:0}));
