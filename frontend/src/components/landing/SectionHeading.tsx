import type { ReactNode } from "react";
export function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <div className="landing-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{children && <div className="landing-description">{children}</div>}</div>;
}
