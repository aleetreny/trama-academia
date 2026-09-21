import type {ComponentProps} from 'react';
import {sitePath} from '@/lib/site-path';

// Static pages work before hydration and avoid prefetching every catalogue link.
export default function SiteLink({href,...props}:ComponentProps<'a'>){return <a {...props} href={href?sitePath(href):href}/>;}
