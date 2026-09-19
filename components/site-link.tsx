import type {ComponentProps} from 'react';

// Native navigation also works before hydration. Vinext beta's production Link
// prefetch/navigation imports currently fail in this Worker build.
export default function SiteLink(props:ComponentProps<'a'>){return <a {...props}/>;}
