import { HeroSection } from "../components/landing/HeroSection";
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
  return <>
    <HeroSection />
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
