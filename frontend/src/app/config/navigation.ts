import type { Translator } from "../i18n/config";
import { LayoutDashboard, BrainCircuit, MapPinned, BriefcaseBusiness, Factory, ChartNoAxesCombined, Boxes, FileText } from "lucide-react";
import type { PageMetadata } from "../../types/intelligence";

export function getNavigation(t: Translator): readonly PageMetadata[] { return [
  { path: "/intelligence", label: t("common.overview"), title: t("common.intelligence"), description: t("navigation.overviewDescription"), icon: LayoutDashboard, availability: "sample" },
  { path: "/skills", label: t("common.skills"), title: t("navigation.skillsTitle"), description: t("navigation.skillsDescription"), icon: BrainCircuit, availability: "sample" },
  { path: "/regions", label: t("common.regions"), title: t("navigation.regionsTitle"), description: t("navigation.regionsDescription"), icon: MapPinned, availability: "sample" },
  { path: "/occupations", label: t("common.occupations"), title: t("navigation.occupationsTitle"), description: t("navigation.occupationsDescription"), icon: BriefcaseBusiness, availability: "sample" },
  { path: "/industries", label: t("common.industries"), title: t("navigation.industriesTitle"), description: t("navigation.industriesDescription"), icon: Factory, availability: "sample" },
  { path: "/demand", label: t("common.demand"), title: t("navigation.demandTitle"), description: t("navigation.demandDescription"), icon: ChartNoAxesCombined, availability: "sample" },
  { path: "/forecast", label: t("common.forecast"), title: t("workspace.forecastTitle"), description: t("workspace.forecastIntro"), icon: ChartNoAxesCombined, availability: "sample" },
  { path: "/spatial", label: t("workspace.spatialTitle"), title: t("navigation.spatialTitle"), description: t("navigation.spatialDescription"), icon: Boxes, availability: "sample" },
  { path: "/reports", label: t("common.reports"), title: t("navigation.reportsTitle"), description: t("navigation.reportsDescription"), icon: FileText, availability: "sample" },
]; }
export function getMissingPage(t: Translator): PageMetadata { return {
  path: "*", label: t("navigation.notFound"), title: t("navigation.notFound"),
  description: t("navigation.notFoundDescription"), icon: LayoutDashboard, availability: "planned",
}; }
