import { useLocale } from "../../hooks/usePreferences";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { AuthLink } from "../auth/AuthLink";
export function FinalCta() {
  const { t } = useLocale();

  return <section className="final-cta public-wrap"><p className="eyebrow">{t("cta.eyebrow")}</p>
    <h2>{t("cta.title")}</h2>
    <div><Link to="/intelligence" className="button button-primary">{t("common.explore")}<ArrowRight size={16} aria-hidden="true" /></Link>
      <AuthLink mode="signup" className="button button-secondary">{t("common.getStarted")}</AuthLink></div>
    <p>{t("cta.note")}</p>
  </section>;
}
