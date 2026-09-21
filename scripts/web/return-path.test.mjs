import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NEXT_PUBLIC_BASE_PATH = '/trama-academia';
const {sitePath} = await import('../../lib/site-path.ts');
const {MAX_RETURN_QUERY_LENGTH, opportunityHref, readReturnHref, returnLinkLabel, safeReturnHref} = await import('../../lib/return-path.ts');

test('detail links round-trip filters and pagination through the project base path', () => {
  const contexts = [
    '/explorar?etapa=master&q=aprendizaje+autom%C3%A1tico&pais=ES&pagina=3',
    '/financiacion?etapa=doctorado&q=Marie+Curie',
    '/programas?tipo=summer-school&etapa=doctorado&pais=FI&pagina=2',
    '/seleccion?q=inform%C3%A1tica&orden=institucion',
  ];
  for (const context of contexts) {
    const detail = new URL(sitePath(opportunityHref('a3f448090c283a748286', context)), 'https://example.org');
    assert.equal(detail.pathname, '/trama-academia/oportunidad/a3f448090c283a748286/');
    assert.equal(detail.searchParams.get('desde'), context);
    const restored = readReturnHref(detail.search, '/explorar');
    assert.equal(restored, context);
    assert.equal(new URL(sitePath(restored), detail).pathname, '/trama-academia/' + context.split('?')[0].slice(1) + '/');
    assert.equal(safeReturnHref(sitePath(context)), context);
  }
});

test('return routes accept only the four catalogue destinations and the configured base path', () => {
  for (const path of ['/explorar', '/financiacion', '/programas', '/seleccion']) {
    assert.equal(safeReturnHref(path + '/'), path);
    assert.equal(safeReturnHref('/trama-academia' + path + '/?q=tesis'), path + '?q=tesis');
    assert.equal(safeReturnHref(path, ''), path);
    assert.equal(safeReturnHref('/otro-proyecto' + path, '/otro-proyecto'), path);
  }
  for (const unsafe of [
    'https://example.org/explorar', 'https://evil.example/programas', '//evil.example/explorar',
    'javascript:alert(1)', 'data:text/html,hello', '/\\evil.example/explorar',
    '/%2Fexplorar', '/explorar%2f', '/explorar/../seleccion', '/explorar/%2e%2e/seleccion',
    '/programas//', '/trama-academia//explorar', '/trama-academia-evil/explorar',
    '/otro-proyecto/explorar', '/oportunidad/abc', '/guia', '/', 'explorar',
    '\n/explorar', '/explorar?x=\r\nLocation:evil',
  ]) {
    assert.equal(safeReturnHref(unsafe), undefined, unsafe);
    assert.equal(readReturnHref('?' + new URLSearchParams({desde: unsafe}), '/programas'), '/programas');
  }
});

test('return context keeps query values safely encoded and removes fragments and nested return parameters', () => {
  const context = '/explorar?q=C%2B%2B+%26+%22datos%22+%23+https%3A%2F%2Funi.example&pais=ES';
  assert.equal(safeReturnHref(context + '#unexpected-target'), context);
  assert.equal(safeReturnHref('/programas#https://evil.example/'), '/programas');
  assert.equal(safeReturnHref('/seleccion?desde=%2Fexplorar&q=tesis'), '/seleccion?q=tesis');
  const detail = opportunityHref('example-id', context);
  assert.equal(readReturnHref(detail.slice(detail.indexOf('?'))), context);
});

test('oversized return queries are rejected before and after URL encoding', () => {
  assert.equal(safeReturnHref('/explorar?q=' + 'a'.repeat(MAX_RETURN_QUERY_LENGTH - 2)), '/explorar?q=' + 'a'.repeat(MAX_RETURN_QUERY_LENGTH - 2));
  assert.equal(safeReturnHref('/explorar?q=' + 'a'.repeat(MAX_RETURN_QUERY_LENGTH - 1)), undefined);
  assert.equal(safeReturnHref('/explorar?q=' + 'á'.repeat(400)), undefined);
  assert.equal(readReturnHref('?desde=' + 'a'.repeat(7000), '/seleccion'), '/seleccion');
});

test('missing, ambiguous and invalid return values use a safe deterministic fallback', () => {
  assert.equal(readReturnHref('', '/explorar?etapa=master'), '/explorar?etapa=master');
  assert.equal(readReturnHref('?desde=', '/financiacion'), '/financiacion');
  assert.equal(readReturnHref('?desde=%2Fseleccion&desde=%2Fprogramas', '/explorar'), '/explorar');
  assert.equal(readReturnHref('', 'https://evil.example/'), '/explorar');
  assert.equal(opportunityHref('example-id'), '/oportunidad/example-id');
  assert.equal(opportunityHref('example-id', '//evil.example/'), '/oportunidad/example-id');
  for (const id of ['', '..', '../explorar', 'id?desde=evil', 'id#anchor']) {
    assert.throws(() => opportunityHref(id), /invalid_opportunity_id/);
  }
});

test('return text describes the actual destination', () => {
  assert.equal(returnLinkLabel('/seleccion?q=tesis'), 'Volver a mi selección');
  assert.equal(returnLinkLabel('/programas?tipo=funding'), 'Volver a programas');
  assert.equal(returnLinkLabel('/financiacion'), 'Volver a financiación');
  assert.equal(returnLinkLabel('/explorar?etapa=doctorado'), 'Volver a resultados');
});
