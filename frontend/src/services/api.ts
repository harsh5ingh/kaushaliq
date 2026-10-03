const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "/api";

export const api = {
  async get<T>(path: string, decode: (value: unknown) => T, signal?: AbortSignal): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`API request failed (${response.status})`);
    const value: unknown = await response.json();
    return decode(value);
  },
};
export interface HealthResponse { status: string; app: string; version: string }
export function decodeHealth(value: unknown): HealthResponse {
  if (typeof value !== "object" || value === null || !("status" in value) || !("app" in value) || !("version" in value)
    || typeof value.status !== "string" || typeof value.app !== "string" || typeof value.version !== "string"
    || value.status !== "ok") throw new Error("Unexpected health response");
  return { status: value.status, app: value.app, version: value.version };
}
