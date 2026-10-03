import { useLocale } from "../../hooks/usePreferences";
export function RelationshipGraph() {
  const { t } = useLocale();
  const nodes = [
    { key: "connections.skills", x: 114, y: 104, className: "graph-skills" },
    { key: "connections.occupations", x: 300, y: 52, className: "graph-occupations" },
    { key: "connections.industries", x: 494, y: 104, className: "graph-industries" },
    { key: "connections.regions", x: 300, y: 178, className: "graph-regions" },
  ] as const;
  return <figure className="relationship-graph">
    <svg viewBox="0 0 610 230" role="img" aria-label={t("connections.title")}>
      <path d="M114 104 300 52 494 104 300 178Z M114 104 494 104 M300 52V178" />
      {nodes.map(n => <g key={n.key} className={n.className}><circle cx={n.x} cy={n.y} r="6" /><circle cx={n.x} cy={n.y} r="15" /></g>)}
      {nodes.map(n => <text key={n.key} x={n.x} y={n.y + 36} textAnchor="middle">{t(n.key)}</text>)}
    </svg>
    <figcaption>{t("connections.concept")}</figcaption>
  </figure>;
}
