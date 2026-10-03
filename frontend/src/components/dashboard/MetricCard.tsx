import type { Metric } from "../../types/intelligence";
import { StatusBadge } from "../ui/StatusBadge";

export function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;
  return <article className="metric-card">
    <div className="metric-top"><span className="metric-icon"><Icon size={19} aria-hidden="true" /></span><StatusBadge kind={metric.kind} /></div>
    <p className="metric-value">{metric.value}</p><h3>{metric.label}</h3><p className="metric-note">{metric.note}</p>
  </article>;
}
