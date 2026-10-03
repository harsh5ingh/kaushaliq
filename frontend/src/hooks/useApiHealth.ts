import { useEffect, useRef, useState } from "react";
import { api, decodeHealth, type HealthResponse } from "../services/api";

type HealthState = { status: "idle" | "loading" } | { status: "success"; data: HealthResponse } | { status: "error" };
export function useApiHealth() {
  const [state, setState] = useState<HealthState>({ status: "idle" });
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => { pending.current?.abort(); pending.current = null; }, []);
  async function check() {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setState({ status: "loading" });
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const data = await api.get("/health", decodeHealth, controller.signal);
      if (pending.current === controller) setState({ status: "success", data });
    } catch {
      if (pending.current === controller) setState({ status: "error" });
    } finally { window.clearTimeout(timeout); }
  }
  return { state, check };
}
