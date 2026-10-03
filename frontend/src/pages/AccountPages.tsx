import { Link } from "react-router-dom";
import { useLocale } from "../hooks/usePreferences";

export function HelpPage() {
  const { t } = useLocale();
  return <section className="account-content"><p>{t("account.helpDescription")}</p><div className="account-help-links"><Link to="/documentation">{t("common.docs")}</Link><Link to="/contact">{t("common.contact")}</Link></div><p>{t("account.demoAccess")}</p></section>;
}
