import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useLocale } from "../../hooks/usePreferences";
import { SectionHeading } from "./SectionHeading";
export function WorkspacePreview() {
  const { t } = useLocale();
  return <section className="public-section public-wrap workspace-preview-section">
    <div className="preview-copy"><SectionHeading eyebrow={t("workspacePreview.eyebrow")} title={t("workspacePreview.title")}><p>{t("workspacePreview.description")}</p></SectionHeading>
      <Link to="/intelligence" className="text-link">{t("workspacePreview.action")}<ArrowUpRight size={16} aria-hidden="true" /></Link></div>
    <figure className="workspace-specimen" aria-label={t("workspacePreview.sample")}>
      <div className="specimen-top"><span className="specimen-dot" /><span>{t("workspacePreview.sample")}</span><span className="specimen-year">{t("workspacePreview.scope")}</span></div>
      <div className="specimen-body">
        <div className="specimen-side"><span className="specimen-rule" /><span /><span /><span /><span /></div>
        <div className="specimen-content"><p>{t("workspacePreview.panel")}</p><div className="specimen-metrics"><div><span>{t("workspacePreview.signal")}</span><strong>—</strong><small>{t("workspacePreview.unavailable")}</small></div><div><span>{t("workspacePreview.region")}</span><strong>—</strong><small>{t("workspacePreview.unavailable")}</small></div></div>
          <div className="specimen-chart" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><svg viewBox="0 0 460 72"><path d="M0 56 C40 52 48 28 92 35 S145 52 184 38 238 16 280 29 336 50 374 30 423 22 460 12" /></svg></div>
          <span className="specimen-disclosure">{t("workspacePreview.sampleValue")} · {t("workspacePreview.unavailable")}</span>
        </div>
      </div>
    </figure>
  </section>;
}
