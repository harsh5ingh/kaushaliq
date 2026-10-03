/** Non-informational shape; the owning loading region supplies its accessible label. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />;
}
