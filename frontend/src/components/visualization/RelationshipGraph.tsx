import type { Evidence } from "../../features/real-intelligence/contracts";
import { useLocale } from "../../hooks/usePreferences";
import { UnavailableIntelligence } from "./UnavailableIntelligence";

// No synthetic coordinates/edges. Future acquisition supplies both endpoint IDs and evidence.
export interface RelationshipNode { id: string; label: string; type: "skill" | "occupation" | "industry" | "region"; evidence: Evidence }
export interface RelationshipEdge { id: string; from: string; to: string; label: string; status: "OBSERVED" | "DERIVED"; methodology: string; evidence: Evidence }
export interface RelationshipData { nodes: readonly RelationshipNode[]; edges: readonly RelationshipEdge[]; period: string }
export function RelationshipGraph({ data, selected, onSelect, onEvidence }: {
  data: RelationshipData | null; selected?: string; onSelect?: (id: string) => void; onEvidence?: (evidence: Evidence) => void;
}) {
  const { t } = useLocale();
  if (!data?.edges.length) return <UnavailableIntelligence title={t("viz.relationshipTitle")} description={t("viz.relationshipNote")} />;
  // Accessible edge list is the renderer-independent fallback. A graph renderer is deferred until
  // actual connected relationships justify pan/zoom/layout dependencies.
  const labels = new Map(data.nodes.map(node => [node.id, node.label]));
  return <section aria-label={t("viz.relationshipTitle")}><p>{data.period}</p><ul>{data.edges.filter(edge => labels.has(edge.from) && labels.has(edge.to)).map(edge => <li key={edge.id}>
    <button type="button" aria-pressed={selected === edge.from} onClick={() => onSelect?.(edge.from)}>{labels.get(edge.from)}</button> ↔ {labels.get(edge.to)} · {edge.label} · {t(edge.status === "OBSERVED" ? "real.observed" : "common.derived")}
    <p>{edge.methodology}</p><button type="button" onClick={() => onEvidence?.(edge.evidence)}>{t("real.evidence")}</button>
  </li>)}</ul></section>;
}
