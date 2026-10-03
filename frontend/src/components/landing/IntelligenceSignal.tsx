import { useLocale } from "../../hooks/usePreferences";

export function IntelligenceSignal() {
  const { t } = useLocale();
const stages = [
  { name: t("signal.data"), detail: t("signal.dataDetails"), description: t("signal.dataDescription") },
  { name: t("signal.signals"), detail: t("signal.signalsDetails"), description: t("signal.signalsDescription") },
  { name: t("common.intelligenceNav"), detail: t("signal.intelligenceDetails"), description: t("signal.intelligenceDescription") },
  { name: t("signal.decisions"), detail: t("signal.decisionsDetails"), description: t("signal.decisionsDescription") },
];

  return (
    <figure className="signal-visual">
      <div className="signal-visual-heading">
        <span>{t("signal.heading")}</span>
        <span className="signal-preview">{t("signal.preview")}</span>
      </div>
      <div className="signal-visual-body">
        <svg className="signal-traces" viewBox="0 0 100 360" preserveAspectRatio="none" aria-hidden="true">
          <path className="signal-trace-muted" d="M5 0V24Q5 44 25 44H50 M95 0V24Q95 44 75 44H50 M25 0V12Q25 24 50 24V44 M75 0V12Q75 24 50 24" />
          <path className="signal-trace-main" d="M50 44V314" />
          {[44, 134, 224, 314].map((y) => (
            <g key={y}>
              <path className="signal-trace-muted" d={`M50 ${y}H98`} />
              <circle className="signal-node-halo" cx="50" cy={y} r="9" />
              <circle className="signal-node" cx="50" cy={y} r="3" />
            </g>
          ))}
        </svg>
        <ol className="signal-stages">
          {stages.map((stage, index) => (
            <li key={stage.name}>
              <div className="signal-stage-title"><h2>{stage.name}</h2><span aria-hidden="true">0{index + 1}</span></div>
              <p>{stage.description}</p>
              <span className="signal-stage-context">{stage.detail}</span>
            </li>
          ))}
        </ol>
      </div>
      <figcaption>{t("signal.note")}</figcaption>
    </figure>
  );
}
