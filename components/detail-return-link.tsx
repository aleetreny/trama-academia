'use client';

import {useSyncExternalStore} from 'react';
import {ArrowLeft} from 'lucide-react';
import Link from '@/components/site-link';
import {readReturnHref, returnLinkLabel, safeReturnHref} from '@/lib/return-path';

function subscribeToNavigation(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

export default function DetailReturnLink({fallbackHref}: {fallbackHref: string}) {
  const fallback = safeReturnHref(fallbackHref) || '/explorar';
  const href = useSyncExternalStore(
    subscribeToNavigation,
    () => readReturnHref(window.location.search, fallback),
    () => fallback,
  );

  return <Link className="back-link" href={href}>
    <ArrowLeft size={16} aria-hidden="true"/> {returnLinkLabel(href)}
  </Link>;
}
