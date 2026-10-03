// Adapter for retained legacy links; the original deterministic model is unchanged.
export function samplePath(path: string) { return path + `${path.includes("?") ? "&" : "?"}data=sample`; }
