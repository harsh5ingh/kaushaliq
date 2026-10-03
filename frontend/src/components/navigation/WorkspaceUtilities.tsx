import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { ProductPreferences } from "./ProductPreferences";
import { useLocale } from "../../hooks/usePreferences";

export function WorkspaceUtilities({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {

  const { t } = useLocale();
  return <div className={compact ? "workspace-utilities compact" : "workspace-utilities"}>
    <Link to="/" title={t("common.website")} onClick={onNavigate}><ArrowUpRight size={18} aria-hidden="true" /><span>{t("common.website")}</span></Link>
    <Link to="/my-intelligence" onClick={onNavigate}>{t('personal.title')}</Link>
    {!compact && <ProductPreferences />}
  </div>;
}
