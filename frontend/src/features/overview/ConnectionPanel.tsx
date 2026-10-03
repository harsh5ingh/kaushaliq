import { useLocale } from "../../hooks/usePreferences";
import { CheckCircle2, Server } from "lucide-react";
import { useApiHealth } from "../../hooks/useApiHealth";
import { SecondaryButton } from "../../components/ui/Buttons";
import { LoadingState, ErrorState } from "../../components/ui/States";

export function ConnectionPanel() {
  const { t } = useLocale();

  const { state, check } = useApiHealth();
  return <div className="connection-panel">
    <div className="connection-heading"><Server size={17} aria-hidden="true" /><h3>{t("connection.title")}</h3></div>
    {state.status === "idle" && <><p>{t("connection.description")}</p><SecondaryButton onClick={check}>{t("connection.check")}</SecondaryButton></>}
    {state.status === "loading" && <LoadingState label={t("connection.checking")} />}
    {state.status === "error" && <ErrorState title={t("connection.error")} description={t("connection.errorDescription")} onRetry={check} />}
    {state.status === "success" && <div role="status" className="connection-success"><CheckCircle2 size={18} aria-hidden="true" />
      <div><strong>{t("connection.reachable", { app: state.data.app })}</strong><p>{t("connection.version", { version: state.data.version })}</p><SecondaryButton onClick={check}>{t("connection.again")}</SecondaryButton></div>
    </div>}
  </div>;
}
