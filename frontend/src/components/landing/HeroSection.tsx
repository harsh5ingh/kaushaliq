import { useState } from "react";
import { ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocale, useTheme } from "../../hooks/usePreferences";
import { useDemandSnapshot } from "../../features/demand/useDemandSnapshot";
import { EvidencePanel } from "../../features/real-intelligence/EvidencePanel";
import { ErrorState, EmptyState } from "../ui/States";
import { IconButton } from "../ui/Buttons";
import { Skeleton } from "../ui/Skeleton";
import { CountUp } from "../ui/CountUp";
import darkBackground from "../../assets/india-workforce-dark.webp";
import lightBackground from "../../assets/india-workforce-light.webp";
import type { Source } from "../../features/real-intelligence/contracts";
import type { MessageKey } from "../../app/i18n/config";

const sourceMarks: { ids: string[]; label: MessageKey }[] = [
  { ids: ["plfs-pib-2024", "plfs-annual-2023-24"], label: "hero.sourcePlfs" },
  { ids: ["ncs-active-pib-2025"], label: "hero.sourceNcs" },
  { ids: ["pmkvy-pib-2026"], label: "hero.sourcePmkvy" },
  { ids: ["nic-2008"], label: "hero.sourceNic" },
];

function SourceMarquee({ sources }: { sources: Source[] }) {
  const { t } = useLocale();
  const [paused, setPaused] = useState(false);
  const marks = sourceMarks.filter(mark => sources.some(source => source.connected && mark.ids.includes(source.source_id)));
  return <section className="hero-source-card" aria-labelledby="hero-sources-heading">
    <div className="hero-source-header"><h2 id="hero-sources-heading">{t("hero.sources")}</h2>
      <IconButton label={t(paused ? "hero.resumeSources" : "hero.pauseSources")} onClick={() => setPaused(value => !value)} aria-pressed={paused}>
        {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
      </IconButton>
    </div>
    <div className={`hero-source-window${paused ? " is-paused" : ""}`}>
      <div className="hero-source-track">
        {[false, true].map(duplicate => <ul key={String(duplicate)} aria-hidden={duplicate || undefined} className={duplicate ? "hero-source-duplicate" : undefined}>
          {marks.map(mark => <li key={mark.label}>{t(mark.label)}</li>)}
        </ul>)}
      </div>
    </div>
    <p className="hero-source-note">{t("hero.sourceNote")}</p>
  </section>;
}

function SnapshotLoading() {
  const { t } = useLocale();
  return <div className="hero-snapshot-loading" role="status">
    <span className="sr-only">{t("hero.loading")}</span>
    <Skeleton className="hero-skeleton-label" /><Skeleton className="hero-skeleton-metric" />
    <Skeleton className="hero-skeleton-label" /><div className="hero-skeleton-pair"><Skeleton /><Skeleton /></div>
    <Skeleton /><Skeleton className="hero-skeleton-label" />
  </div>;
}

export function HeroSection() {
  const { t, locale } = useLocale();
  const { resolved } = useTheme();
  const snapshot = useDemandSnapshot();
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [lead, accent] = t("hero.title").split("\n");
  const date = (value: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
  // Match the publication's requested international grouping in English; Hindi uses Indian grouping.
  const number = (value: number) => new Intl.NumberFormat(locale === "en-IN" ? "en-GB" : locale).format(value);
  return <section className="home-hero" aria-labelledby="home-heading">
    <div className="hero-background" aria-hidden="true">
      <img className="hero-image" src={resolved === "dark" ? darkBackground : lightBackground} alt="" width="1823" height="863" fetchPriority="high" />
    </div>
    <div className="hero-composition">
      <div className="home-hero-copy">
        <p className="home-hero-eyebrow">{t("hero.kicker")}</p>
        <h1 id="home-heading"><span>{lead}</span><span className="hero-heading-accent">{accent}</span></h1>
        <p className="home-hero-description">{t("hero.description")}</p>
        <div className="home-hero-actions">
          <Link className="button button-primary" to="/intelligence">{t("hero.cta")}<ArrowRight size={17} aria-hidden="true" /></Link>
          <Link className="button button-secondary" to="/demand">{t("hero.secondary")}<ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
        <p className="home-hero-note">{t("hero.disclosure")}</p>
      </div>
      <div className="hero-intelligence-column">
        <section className="hero-snapshot-card" aria-labelledby="hero-snapshot-heading" aria-busy={snapshot.status === "loading"} data-snapshot-state={snapshot.status}>
          <h2 id="hero-snapshot-heading">{t("hero.snapshotTitle")}</h2>
          {snapshot.status === "loading" && <SnapshotLoading />}
          {snapshot.status === "error" && <ErrorState description={t("hero.loadError")} onRetry={snapshot.retry} />}
          {snapshot.status === "unavailable" && <><EmptyState compact title={t("hero.unavailableTitle")} description={t("hero.unavailable")} /><button className="button button-secondary" onClick={snapshot.retry}>{t("states.retry")}</button></>}
          {snapshot.status === "ready" && <>
            <p className="hero-verified-status"><span aria-hidden="true" />{t("hero.verified")}</p>
            <div className="hero-primary-metric"><strong data-hero-vacancies><CountUp value={snapshot.data.observation.value} format={number} /></strong><span>{t("hero.vacancies")}</span></div>
            <dl className="hero-secondary-metrics">
              <div><dt>{t("hero.matchedRegions")}</dt><dd data-hero-regions><CountUp value={snapshot.data.matchedRegions} format={number} duration={1000} /></dd></div>
              <div><dt>{t("hero.observedRecords")}</dt><dd data-hero-records><CountUp value={snapshot.data.observedRecords} format={number} duration={1000} /></dd></div>
            </dl>
            <div className="hero-snapshot-provenance"><p>{t("hero.stock")}</p>
              <p>{t("hero.observed", { date: date(snapshot.data.observation.period_start) })}</p>
              <p>{t("hero.published", { date: date(snapshot.data.observation.publication_date) })}</p>
            </div>
            <div className="hero-snapshot-bottom"><span>{t("hero.historical")}</span><button className="hero-evidence-button" onClick={() => setEvidenceOpen(true)}>{t("real.evidence")}<ArrowUpRight size={15} aria-hidden="true" /></button></div>
          </>}
        </section>
        {snapshot.status === "ready" && <SourceMarquee sources={snapshot.data.sources} />}
      </div>
    </div>
    <p className="hero-art-caption">{t("hero.artwork")}</p>
    {evidenceOpen && snapshot.status === "ready" && <EvidencePanel evidence={snapshot.data.observation.evidence} period={snapshot.data.observation.reference_period} source={snapshot.data.source} onClose={() => setEvidenceOpen(false)} />}
  </section>;
}
