import {BASE_PATH} from './site-path.ts';

const returnPaths = new Set(['/explorar', '/financiacion', '/programas', '/seleccion']);
export const MAX_RETURN_QUERY_LENGTH = 1800;
const maxReturnHrefLength = 2048;

// Only accept literal catalogue routes. Parsing an arbitrary URL first would
// normalize encoded slashes, backslashes or traversal before checking the route.
export function safeReturnHref(value: string | null | undefined, basePath = BASE_PATH): string | undefined {
  if (!value || value.length > maxReturnHrefLength || /[\u0000-\u001f\u007f]/.test(value)) return undefined;
  const withoutHash = value.split('#', 1)[0];
  const queryStart = withoutHash.indexOf('?');
  let pathname = queryStart < 0 ? withoutHash : withoutHash.slice(0, queryStart);
  const queryText = queryStart < 0 ? '' : withoutHash.slice(queryStart + 1);
  const prefix = basePath.replace(/\/$/, '');
  if (prefix && pathname.startsWith(prefix + '/')) pathname = pathname.slice(prefix.length);
  pathname = pathname.replace(/\/$/, '');
  if (!returnPaths.has(pathname) || queryText.length > MAX_RETURN_QUERY_LENGTH) return undefined;

  const query = new URLSearchParams(queryText);
  query.delete('desde');
  const serialized = query.toString();
  if (serialized.length > MAX_RETURN_QUERY_LENGTH) return undefined;
  return pathname + (serialized ? '?' + serialized : '');
}

export function opportunityHref(id: string, returnHref?: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('invalid_opportunity_id');
  const href = '/oportunidad/' + id;
  const origin = safeReturnHref(returnHref);
  return origin ? href + '?' + new URLSearchParams({desde: origin}).toString() : href;
}

export function readReturnHref(search: string, fallbackHref = '/explorar'): string {
  const fallback = safeReturnHref(fallbackHref) || '/explorar';
  // The encoded `desde` parameter can be longer than the decoded return path.
  if (search.length > maxReturnHrefLength * 3 + 100) return fallback;
  const origins = new URLSearchParams(search).getAll('desde');
  return origins.length === 1 ? safeReturnHref(origins[0]) || fallback : fallback;
}

export function returnLinkLabel(href: string): string {
  const pathname = safeReturnHref(href)?.split('?')[0];
  if (pathname === '/seleccion') return 'Volver a mi selección';
  if (pathname === '/programas') return 'Volver a programas';
  if (pathname === '/financiacion') return 'Volver a financiación';
  return 'Volver a resultados';
}
