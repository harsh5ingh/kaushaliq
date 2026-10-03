import { useLocale } from "../hooks/usePreferences";
import { ProcessSection } from "../components/landing/ProcessSection";
export function HowItWorksPage() {
  const { t } = useLocale();


  return (
    <>
    <section className="public-page">
      <div className="public-page-inner">
        <p className="eyebrow">{t("how.eyebrow")}</p>

        <h1>{t("how.title")}</h1>

        <p className="public-page-lead">
          {t("how.description")}</p>
      </div>
    </section>
    <ProcessSection />
    </>
  );
}