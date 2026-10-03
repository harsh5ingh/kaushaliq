import { useLocale } from "../../hooks/usePreferences";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { getNavigation } from "../../app/config/navigation";
import { SectionHeading } from "./SectionHeading";
export function ModulesSection() {
  const { t } = useLocale();
  const navigation = getNavigation(t);
  return <section className="public-section public-wrap modules-section">
    <div className="section-lead"><SectionHeading eyebrow={t("modules.eyebrow")} title={t("modules.title")}><p>{t("modules.description")}</p></SectionHeading>
      <div className="preview-availability"><span className="available-indicator" />{t("modules.available")}<p>{t("modules.availabilityDetail")}</p>
        <Link className="text-link" to="/intelligence">{t("modules.explore")}<ArrowUpRight size={15} aria-hidden="true" /></Link>
      </div>
    </div>
    <div className="module-list">{navigation.filter(page => page.path !== "/intelligence").map((page,i)=><Link className="module-row" key={page.path} to={page.path}>
      <span className="editorial-number">0{i+1}</span><span className="module-title"><page.icon size={20} aria-hidden="true" />{page.title}</span>
      <p>{page.description}</p><span className="module-status">{t("modules.planned")}</span><ArrowUpRight size={18} aria-hidden="true" />
    </Link>)}</div>
  </section>;
}
