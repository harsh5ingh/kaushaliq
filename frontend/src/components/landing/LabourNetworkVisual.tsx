import { useState } from "react";
import { useLocale } from "../../hooks/usePreferences";

type Layer = "region" | "industry" | "occupation" | "skills" | "demand";
const point: Record<Layer, { x: number; y: number }> = {
  region: { x: 116, y: 198 }, industry: { x: 270, y: 94 }, occupation: { x: 414, y: 198 }, skills: { x: 558, y: 94 }, demand: { x: 690, y: 198 },
};
export function LabourNetworkVisual() {
  const { t } = useLocale();
  const [active, setActive] = useState<Layer>("region");
  const layers: { id: Layer; label: string; detail: string }[] = [
    { id: "region", label: t("hero.region"), detail: t("hero.regionDetail") },
    { id: "industry", label: t("hero.industry"), detail: t("hero.industryDetail") },
    { id: "occupation", label: t("hero.occupation"), detail: t("hero.occupationDetail") },
    { id: "skills", label: t("hero.skills"), detail: t("hero.skillsDetail") },
    { id: "demand", label: t("hero.demand"), detail: t("hero.demandDetail") },
  ];
  const selected = layers.find(layer => layer.id === active)!;
  return <figure className="labour-network" aria-labelledby="network-title">
    <div className="network-topline"><h2 id="network-title">{t("hero.visualTitle")}</h2><span>{t("hero.visualDisclosure")}</span></div>
    <div className="network-stage">
      <svg viewBox="0 0 780 290" role="img" aria-labelledby="network-svg-title network-svg-desc">
        <title id="network-svg-title">{t("hero.visualTitle")}</title>
        <desc id="network-svg-desc">{t("connections.concept")}</desc>
        <path className="network-link" d="M116 198 C170 198 211 94 270 94 S357 198 414 198 S502 94 558 94 S633 198 690 198" />
        <path className="network-link network-link-secondary" d="M116 198 C224 268 312 270 414 198 S592 267 690 198" />
        {Object.entries(point).map(([id, p]) => <g key={id} className={active === id ? "network-node is-active" : "network-node"}>
          <circle cx={p.x} cy={p.y} r="15" /><circle cx={p.x} cy={p.y} r="4" />
        </g>)}
        <path className="network-axis" d="M34 252H746" />
      </svg>
      <div className="network-buttons" role="group" aria-label={t("hero.selectLayer")}>
        {layers.map(layer => <button key={layer.id} type="button" aria-pressed={active === layer.id}
          className={active === layer.id ? "network-button is-active" : "network-button"}
          style={{ "--node-x": `${point[layer.id].x / 7.8}%`, "--node-y": `${point[layer.id].y / 2.9}%` } as React.CSSProperties}
          onClick={() => setActive(layer.id)}>
          <span>{layer.label}</span>
        </button>)}
      </div>
    </div>
    <div className="network-selection" aria-live="polite">
      <span>{t("hero.activeLayer")}</span><strong>{selected.label}</strong><small>{selected.detail}</small>
    </div>
    <figcaption>{t("hero.selectLayer")}</figcaption>
  </figure>;
}
