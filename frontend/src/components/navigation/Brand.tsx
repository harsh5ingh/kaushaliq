import { useLocale } from "../../hooks/usePreferences";
import { Link } from "react-router-dom";
import fullLogo from "../../assets/kaushaliq-logo.png";
import compactLogo from "../../assets/kaushaliq-mark.png";

export function Brand({ full = false }: { full?: boolean }) {
  const { t } = useLocale();

  return <Link to="/" className={`brand asset-brand ${full ? "asset-brand-full" : ""}`} aria-label={t("common.home")}>
    <picture>
      {!full && <source media="(max-width: 1199px)" srcSet={compactLogo} />}
      <img src={fullLogo} alt="KaushalIQ" className="brand-image" />
    </picture>
  </Link>;
}
