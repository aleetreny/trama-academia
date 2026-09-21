import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NEXT_PUBLIC_BASE_PATH='/trama-academia';
const {sitePath,assetPath}=await import('../../lib/site-path.ts');
test('project base works for deep links, filters, anchors and static assets',()=>{
 assert.equal(sitePath('/explorar?etapa=master#contenido'),'/trama-academia/explorar/?etapa=master#contenido');
 assert.equal(sitePath('/oportunidad/abc'),'/trama-academia/oportunidad/abc/');
 assert.equal(sitePath('/favicon.svg'),'/trama-academia/favicon.svg');
 assert.equal(sitePath('/trama-academia/fuentes/'),'/trama-academia/fuentes/');
 assert.equal(sitePath('https://example.org/'),'https://example.org/');
 assert.equal(sitePath('#metodo'),'#metodo');
 assert.equal(assetPath('data/manifest.json'),'/trama-academia/data/manifest.json');
});
