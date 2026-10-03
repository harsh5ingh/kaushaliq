import type { ComponentPropsWithoutRef, ReactNode } from "react";

export function Panel({ className = "", ...props }: ComponentPropsWithoutRef<"section">) {
  return <section className={`panel ${className}`} {...props} />;
}
export function SectionHeader({ title, eyebrow, description, action, id }: {
  title: string; eyebrow?: string; description?: string; action?: ReactNode; id?: string;
}) {
  return <div className="section-header">
    <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id}>{title}</h2>{description && <p className="section-description">{description}</p>}
    </div>{action && <div className="section-action">{action}</div>}
  </div>;
}
