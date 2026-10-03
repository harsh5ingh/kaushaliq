import { LoaderCircle } from 'lucide-react';
/** Decorative progress indicator: its surrounding status supplies the accessible label. */
export function Loader() { return <LoaderCircle className="progress-loader" size={18} aria-hidden="true" />; }
