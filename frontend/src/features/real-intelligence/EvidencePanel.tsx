import { Modal } from "../../components/ui/Modal";
import { useLocale } from "../../hooks/usePreferences";
import { useIntelligenceData } from "./dataContext";
import type { Evidence } from "./contracts";

export function EvidencePanel({ evidence, period, onClose }: { evidence: Evidence; period: string; onClose: () => void }) {
  const { t, locale } = useLocale(); const { catalog } = useIntelligenceData();
  const source = catalog?.sources.find(s => s.source_id === evidence.source_id);
  return <Modal title={t("real.evidence")} id="evidence-heading" onClose={onClose} className="evidence-dialog">
    {source && <><p className="real-note">{t("real.sourceLanguage")}</p><dl className="evidence-details">
      <dt>{t("real.source")}</dt><dd lang="en"><a href={source.url} target="_blank" rel="noreferrer">{source.dataset_name}</a></dd>
      <dt>{t("real.publisher")}</dt><dd lang="en">{source.publisher}</dd>
      <dt>{t("real.period")}</dt><dd>{period}</dd>
      <dt>{t("real.version")}</dt><dd lang="en">{source.version}</dd>
      <dt>{t("real.region")}</dt><dd lang="en">{source.geography}</dd>
      <dt>{t("real.retrieved")}</dt><dd>{source.retrieved_at ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(source.retrieved_at)) : "—"}</dd>
      <dt>{t("real.locator")}</dt><dd lang="en">{evidence.locator}</dd>
      <dt>{t("real.methodology")}</dt><dd lang="en">{source.methodology}</dd>
      <dt>{t("real.transformations")}</dt><dd lang="en"><ul>{evidence.transformations.map(item => <li key={item}>{item}</li>)}</ul></dd>
      <dt>{t("real.terms")}</dt><dd lang="en"><a href={source.license_url ?? undefined} target="_blank" rel="noreferrer">{source.license}</a></dd>
      <dt>{t("real.limits")}</dt><dd lang="en">{source.notes}</dd>
      <dt>{t("real.hash")}</dt><dd><code>{evidence.raw_sha256}</code></dd>
    </dl></>}
  </Modal>;
}
