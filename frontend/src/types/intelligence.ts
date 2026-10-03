import type { LucideIcon } from "lucide-react";

export type IntelligenceKind = "observed" | "derived" | "forecast" | "scenario" | "sample";
export interface Metric {
  id: string;
  label: string;
  value: string;
  note: string;
  kind: IntelligenceKind;
  icon: LucideIcon;
}
export interface PageMetadata {
  path: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  availability: "sample" | "planned";
}
