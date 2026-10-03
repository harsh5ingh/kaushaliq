import { useLocale } from "../hooks/usePreferences";
import { ModulesSection } from "../components/landing/ModulesSection";
export function ProductPage() {
  const { t } = useLocale();


  return (
    <>
    <section className="public-page">
      <div className="public-page-inner">
        <p className="eyebrow">{t("product.eyebrow")}</p>

        <h1>{t("product.title")}</h1>

        <p className="public-page-lead">
          {t("product.description")}</p>
      </div>
    </section>
    <ModulesSection />
    </>
  );
}