import { Link } from "react-router-dom";
import { Brand } from "../navigation/Brand";
import { socialLinks } from "../../app/config/social";
import { useLocale } from "../../hooks/usePreferences";
import type { MessageKey } from "../../app/i18n/config";
type FooterItem = { key: MessageKey; path: string };
export function PublicFooter() {
  const { t } = useLocale();
  const groups: { title: string; links: FooterItem[] }[] = [
    { title: t("footer.platform"), links: [{key:"common.intelligenceNav",path:"/intelligence"},{key:"common.skills",path:"/skills"},{key:"common.occupations",path:"/occupations"},{key:"common.regions",path:"/regions"},{key:"common.industries",path:"/industries"},{key:"common.forecast",path:"/forecast"}] },
    { title: t("footer.resources"), links: [{key:"common.how",path:"/how-it-works"},{key:"common.docs",path:"/documentation"},{key:"footer.evidence",path:"/#evidence"}] },
    { title: t("common.product"), links: [{key:"common.about",path:"/about"},{key:"common.contact",path:"/contact"},{key:"common.privacy",path:"/privacy"},{key:"common.terms",path:"/terms"}] },
  ];
  return <footer className="public-footer public-wrap">
    <div className="footer-main">
      <div className="footer-brand"><Brand full /><p>{t("footer.description")}</p><span className="footer-product-note">{t("footer.productNote")}</span></div>
      {groups.map(group=><nav key={group.title} className={"footer-group " + (group.title === t("footer.platform") ? "footer-platform" : "")} aria-label={group.title}><h2>{group.title}</h2>
        {group.links.map(({key,path})=><Link key={path} to={path}>{t(key)}</Link>)}</nav>)}
      <nav className="footer-group footer-connect" aria-label={t("footer.connect")}><h2>{t("footer.connect")}</h2>
        <Link to="/intelligence">{t("footer.workspace")}</Link>
        {socialLinks.map(({platform,href,icon})=><a className="footer-github" key={platform} href={href} target="_blank" rel="noopener noreferrer" aria-label={t("footer.external",{platform})}>
          <span className="social-icon" style={{maskImage:`url(${JSON.stringify(icon)})`}} aria-hidden="true"/><span>{platform}</span></a>)}
      </nav>
    </div>
    <div className="footer-bottom"><span>© 2026 KaushalIQ</span><nav aria-label={t("footer.legal")}><Link to="/privacy">{t("common.privacy")}</Link><Link to="/terms">{t("common.terms")}</Link></nav></div>
  </footer>;
}
