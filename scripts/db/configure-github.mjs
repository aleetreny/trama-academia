import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const content=await fs.readFile('.env.writer','utf8');const url=content.match(/^DATABASE_URL=(.+)$/m)?.[1];if(!url)throw new Error('Writer credential missing');
const r=spawnSync('gh',['secret','set','DATABASE_URL','--repo','aleetreny/trama-academia'],{input:url,encoding:'utf8'});
if(r.status!==0)throw new Error('GitHub secret configuration failed');console.log('GitHub repository writer secret configured');
