/** Deep-merge plain objects; arrays and non-plain values from `patch` replace entirely. */
export function mergeDeep<T>(base: T, patch: unknown): T {
  if (patch === undefined || patch === null) return base;
  if (Array.isArray(patch)) return patch as T;
  if (typeof patch !== "object") return patch as T;
  if (typeof base !== "object" || base === null || Array.isArray(base)) {
    return patch as T;
  }
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    const cur = out[k];
    out[k] =
      v !== undefined &&
      v !== null &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      typeof cur === "object" &&
      cur !== null &&
      !Array.isArray(cur)
        ? mergeDeep(cur as object, v)
        : v;
  }
  return out as T;
}
