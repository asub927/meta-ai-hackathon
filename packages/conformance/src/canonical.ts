/** Canonical JSON for the shared vector wire format: object keys sorted
 *  recursively, then JSON.stringify(value, null, 2) plus a trailing newline. */

export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort())
      out[k] = canonicalize((value as Record<string, unknown>)[k]);
    return out;
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value), null, 2) + "\n";
}
