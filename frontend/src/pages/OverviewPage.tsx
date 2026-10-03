import { useState } from "react";
import { Info } from "lucide-react";
import { useLocale } from "../hooks/usePreferences";
import type { IntelligenceKind } from "../types/intelligence";
import { getIntelligenceKinds } from "../app/config/intelligence";
import { SecondaryButton, PrimaryButton } from "../components/ui/Buttons";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Panel } from "../components/ui/Panel";
import { Modal } from "../components/ui/Modal";
import { ConnectionPanel } from "../features/overview/ConnectionPanel";
import { OverviewDashboard } from "./workspace/OverviewDashboard";

export function OverviewPage() {
  const { t } = useLocale();
  const [showSampleInfo, setShowSampleInfo] = useState(false);
  const kinds = getIntelligenceKinds(t);
  return <>
    <div className="snapshot-bar"><div><span className="snapshot-dot" aria-hidden="true" /><strong>{t("overview.snapshot")}</strong><span className="snapshot-detail">{t("overview.year")}</span></div>
      <SecondaryButton onClick={() => setShowSampleInfo(true)}><Info size={15} aria-hidden="true" />{t("overview.about")}</SecondaryButton>
    </div>
    <OverviewDashboard />
    <Panel className="workspace-connection"><ConnectionPanel /><p>{t("overview.connectionNote")}</p></Panel>
    {showSampleInfo && <Modal title={t("overview.about")} id="sample-heading" onClose={() => setShowSampleInfo(false)}>
      <p className="modal-intro">{t("overview.disclosure")}</p>
      <dl className="evidence-definitions">{(Object.entries(kinds) as [IntelligenceKind, { label: string; description: string }][]).map(([kind, info]) =>
        <div key={kind}><dt><StatusBadge kind={kind} /></dt><dd>{info.description}</dd></div>)}</dl>
      <p className="modal-note">{t("overview.periodDisclosure")}</p>
      <PrimaryButton onClick={() => setShowSampleInfo(false)}>{t("overview.gotIt")}</PrimaryButton>
    </Modal>}
  </>;
}
