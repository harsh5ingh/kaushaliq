import { createContext, useContext } from "react";
import type { Catalog } from "./contracts";
export interface DataState { mode: "real" | "sample"; catalog: Catalog | null; error: boolean; retry: () => void }
export const DataContext = createContext<DataState | null>(null);
export function useIntelligenceData() { const value = useContext(DataContext); if (!value) throw new Error("Missing intelligence provider"); return value; }
