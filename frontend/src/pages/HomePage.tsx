import { useLocale } from "../hooks/usePreferences";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { LabourNetworkVisual } from "../components/landing/LabourNetworkVisual";
import "../styles/home-hero.css";
import { AtAGlanceSection } from "../components/landing/AtAGlanceSection";
import { ConnectionsSection } from "../components/landing/ConnectionsSection";
import { SystemSection } from "../components/landing/SystemSection";
import { ModulesSection } from "../components/landing/ModulesSection";
import { ProcessSection } from "../components/landing/ProcessSection";
import { RegionalSection } from "../components/landing/RegionalSection";
import { WorkspacePreview } from "../components/landing/WorkspacePreview";
import { AudienceSection } from "../components/landing/AudienceSection";
import { EvidenceSection } from "../components/landing/EvidenceSection";
import { FinalCta } from "../components/landing/FinalCta";

export function HomePage() {
  const { t } = useLocale();
  return <>
    <section className="home-hero home-hero-network" aria-labelledby="home-heading">
      <div className="home-hero-copy">
        <p className="home-hero-eyebrow">{t("hero.kicker")}</p>
        <h1 id="home-heading">{t("hero.title").split("\n").map((line,index)=><span key={index}>{line}</span>)}</h1>
        <p className="home-hero-description">{t("hero.description")}</p>
        <div className="home-hero-actions">
          <Link className="button button-primary" to="/intelligence">{t("hero.cta")}<ArrowRight size={17} aria-hidden="true" /></Link>
          <Link className="button button-secondary" to="/how-it-works">{t("hero.secondary")}<ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
        <p className="home-hero-note"><span className="preview-rule" aria-hidden="true" />{t("hero.disclosure")}</p>
      </div>
      <LabourNetworkVisual />
    </section>
    <AtAGlanceSection />
    <SystemSection />
    <ConnectionsSection />
    <ModulesSection />
    <ProcessSection />
    <RegionalSection />
    <WorkspacePreview />
    <AudienceSection />
    <EvidenceSection />
    <FinalCta />
  </>;
}
