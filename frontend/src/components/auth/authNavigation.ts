export type AuthMode = "login" | "signup" | "reset";
export function getAuthMode(value: string | null): AuthMode | null {
  return value === "login" || value === "signup" || value === "reset" ? value : null;
}
export function authSearch(search: string, mode: AuthMode | null): string {
  const params = new URLSearchParams(search);
  if (mode) params.set("auth", mode);
  else params.delete("auth");
  return params.size ? `?${params.toString()}` : "";
}
