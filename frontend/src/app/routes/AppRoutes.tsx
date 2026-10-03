import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { NotFoundPage } from "../../pages/CapabilityPage";
import { HomePage } from "../../pages/HomePage";
import { ProductPage } from "../../pages/ProductPage";
import { HowItWorksPage } from "../../pages/HowItWorksPage";
import { PublicInfoPage, type PublicInfoKind } from "../../pages/PublicInfoPage";
import { useLocale } from "../../hooks/usePreferences";
import { AuthGuard } from "../providers/AuthProvider";
import { AuthPage } from "../../pages/AuthPage";
import { HelpPage } from "../../pages/AccountPages";
const PersonalProfilePage = lazy(() => import('../../pages/PersonalProfilePage').then(module => ({ default: module.PersonalProfilePage })));
const PersonalSettingsPage = lazy(() => import('../../pages/PersonalSettingsPage').then(module => ({ default: module.PersonalSettingsPage })));
const MyIntelligencePage = lazy(() => import('../../pages/MyIntelligencePage').then(module => ({ default: module.MyIntelligencePage })));
const OnboardingPage = lazy(() => import('../../pages/OnboardingPage').then(module => ({ default: module.OnboardingPage })));
import { VerifyEmailPage } from '../../pages/VerifyEmailPage';
import { Outlet } from 'react-router-dom';
import { Navigate } from "react-router-dom";
const OverviewPage = import.meta.env.DEV ? lazy(() => import("../../pages/OverviewPage").then(module => ({ default: module.OverviewPage }))) : () => null;
const SkillsIntelligencePage = import.meta.env.DEV ? lazy(() => import("../../pages/workspace/EntityIntelligencePages").then(module => ({ default: module.SkillsIntelligencePage }))) : () => null;
const RegionsIntelligencePage = import.meta.env.DEV ? lazy(() => import("../../pages/workspace/EntityIntelligencePages").then(module => ({ default: module.RegionsIntelligencePage }))) : () => null;
const IndustriesIntelligencePage = import.meta.env.DEV ? lazy(() => import("../../pages/workspace/EntityIntelligencePages").then(module => ({ default: module.IndustriesIntelligencePage }))) : () => null;
const OccupationsIntelligencePage = import.meta.env.DEV ? lazy(() => import("../../pages/workspace/EntityIntelligencePages").then(module => ({ default: module.OccupationsIntelligencePage }))) : () => null;
const DemandIntelligencePage = import.meta.env.DEV ? lazy(() => import("../../pages/workspace/DemandForecastReports").then(module => ({ default: module.DemandIntelligencePage }))) : () => null;
const ForecastIntelligencePage = import.meta.env.DEV ? lazy(() => import("../../pages/workspace/DemandForecastReports").then(module => ({ default: module.ForecastIntelligencePage }))) : () => null;
const IntelligenceReportsPage = import.meta.env.DEV ? lazy(() => import("../../pages/workspace/DemandForecastReports").then(module => ({ default: module.IntelligenceReportsPage }))) : () => null;
// Historical spatial prototype is available only to explicit development regression URLs.
// The production real-data spatial view is dispatched by AppShell; no Three.js import there.
const SpatialIntelligencePage = import.meta.env.DEV ? lazy(() => import("../../pages/workspace/SpatialIntelligencePage").then(module => ({ default: module.SpatialIntelligencePage }))) : null;

const infoRoutes: PublicInfoKind[] = ["about", "contact", "documentation", "privacy", "terms"];
export function AppRoutes() {
  const { t } = useLocale();

  return <Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="/product" element={<ProductPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      {infoRoutes.map((kind) => <Route key={kind} path={`/${kind}`} element={<PublicInfoPage kind={kind} />} />)}
    </Route>
    <Route path="/auth/signin" element={<AuthPage />} />
    <Route path="/auth/signup" element={<AuthPage />} />
    <Route path="/auth/reset" element={<AuthPage />} />
    <Route path="/auth/verify" element={<VerifyEmailPage />} />
    <Route element={<AppShell />}>
      <Route path="/workspace" element={<Navigate to="/intelligence" replace />} />
      <Route element={<AuthGuard><Suspense fallback={<p role="status">{t("workspace.loading")}</p>}><Outlet /></Suspense></AuthGuard>}>
        <Route path="/profile" element={<PersonalProfilePage />} />
        <Route path="/settings" element={<PersonalSettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/my-intelligence" element={<MyIntelligencePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>
      <Route path="/intelligence" element={<Suspense fallback={<div className="route-loading" role="status">{t("workspace.loading")}</div>}><OverviewPage /></Suspense>} />
      <Route path="/skills" element={<Suspense fallback={<div className="route-loading" role="status">{t("workspace.loading")}</div>}><SkillsIntelligencePage /></Suspense>} />
      <Route path="/regions" element={<Suspense fallback={<div className="route-loading" role="status">{t("workspace.loading")}</div>}><RegionsIntelligencePage /></Suspense>} />
      <Route path="/occupations" element={<Suspense fallback={<div className="route-loading" role="status">{t("workspace.loading")}</div>}><OccupationsIntelligencePage /></Suspense>} />
      <Route path="/industries" element={<Suspense fallback={<div className="route-loading" role="status">{t("workspace.loading")}</div>}><IndustriesIntelligencePage /></Suspense>} />
      <Route path="/demand" element={<Suspense fallback={<div className="route-loading" role="status">{t("workspace.loading")}</div>}><DemandIntelligencePage /></Suspense>} />
      <Route path="/forecast" element={<Suspense fallback={<div className="route-loading" role="status">{t("workspace.loading")}</div>}><ForecastIntelligencePage /></Suspense>} />
      <Route path="/spatial" element={SpatialIntelligencePage ? <Suspense fallback={<div className="route-loading" role="status">{t("workspace.loading")}</div>}><SpatialIntelligencePage /></Suspense> : null} />
      <Route path="/reports" element={<Suspense fallback={<div className="route-loading" role="status">{t("workspace.loading")}</div>}><IntelligenceReportsPage /></Suspense>} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>;
}
