import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function assertRefreshHead(expected,current){
 if(!/^[a-f0-9]{40}$/i.test(expected||'')||!/^[a-f0-9]{40}$/i.test(current||''))throw new Error('refresh_head_unverified');
 if(expected!==current)throw new Error('refresh_head_changed: origin/main avanzó; se conserva el diagnóstico y se detiene el resto de la publicación');
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const current=execFileSync('git',['ls-remote','--exit-code','origin','refs/heads/main'],{encoding:'utf8'}).trim().split(/\s+/)[0];
 assertRefreshHead(process.env.GITHUB_SHA,current);
 console.log('origin/main coincide con el commit de esta ejecución; continúa la publicación.');
}
