/** Append-only event log v1 (U11a). Pure: no DOM, no I/O; storage is injected by the caller.
 *  No free text: data values are only string|number and keys come from an allowlist. */

export const LOG_KEY_V1 = "kids-math-log-v1";
export const CHECKSUM_PREFIX = "# sha256:";

/** Default allowlist for data keys. Strategy choices come from the fixed
 *  explainChoices list, so recording them as data is not free text. */
export const DEFAULT_KEYS: readonly string[] = ["choice", "shown", "qIndex", "rung"];

export interface LocalEvent {
  v: 1;
  seq: number;
  type: string;
  data?: Record<string, string | number>;
}

function validData(data: unknown, allowlist: readonly string[]): data is Record<string, string | number> | undefined {
  if (data === undefined) return true;
  if (typeof data !== "object" || data === null || Array.isArray(data)) return false;
  return Object.entries(data as Record<string, unknown>).every(
    ([k, v]) => allowlist.includes(k) && (typeof v === "string" || typeof v === "number"),
  );
}

/** Append one event; seq is the new length. Returns a new array. */
export function append(
  log: LocalEvent[],
  type: string,
  data?: Record<string, string | number>,
  allowlist: readonly string[] = DEFAULT_KEYS,
): LocalEvent[] {
  if (typeof type !== "string" || type === "") throw new Error("bad-event-type");
  if (!validData(data, allowlist)) throw new Error("bad-event-data");
  const ev: LocalEvent = { v: 1, seq: log.length, type };
  if (data !== undefined) ev.data = { ...data };
  return [...log, ev];
}

/** NDJSON body, one event per line. */
export function serialize(log: LocalEvent[]): string {
  return log.map((e) => JSON.stringify(e)).join("\n");
}

/** Export envelope: NDJSON body plus a trailing checksum line. */
export function withChecksum(body: string, hex: string): string {
  return body.length > 0 ? `${body}\n${CHECKSUM_PREFIX}${hex}` : `${CHECKSUM_PREFIX}${hex}`;
}

/** Parse an export file. Skips blank lines and "#" comment/checksum lines.
 *  Throws an Error whose message is the issue code, e.g. "bad-event-line-3". */
export function parseImport(text: string, allowlist: readonly string[] = DEFAULT_KEYS): LocalEvent[] {
  const events: LocalEvent[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (line === "" || line.startsWith("#")) continue;
    const code = `bad-event-line-${i + 1}`;
    let obj: unknown;
    try {
      obj = JSON.parse(line);
    } catch {
      throw new Error(code);
    }
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) throw new Error(code);
    const rec = obj as Record<string, unknown>;
    if (rec.v !== 1 || typeof rec.type !== "string" || rec.type === "") throw new Error(code);
    if (!validData(rec.data, allowlist)) throw new Error(code);
    const ev: LocalEvent = { v: 1, seq: events.length, type: rec.type };
    if (rec.data !== undefined) ev.data = { ...(rec.data as Record<string, string | number>) };
    events.push(ev);
  }
  return events;
}

/** Synchronous FNV-1a hex checksum (unit tests, offline sanity checks). */
export function fnv1aHex(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Async SHA-256 hex digest for the export checksum line (Web Crypto). */
export async function sha256Hex(text: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("no-subtle-crypto");
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Load stored events defensively: garbage in storage yields []. */
export function loadStoredLog(raw: string | null, allowlist: readonly string[] = DEFAULT_KEYS): LocalEvent[] {
  if (!raw) return [];
  try {
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const events: LocalEvent[] = [];
    for (const item of arr) {
      if (typeof item !== "object" || item === null || Array.isArray(item)) continue;
      const rec = item as Record<string, unknown>;
      if (rec.v !== 1 || typeof rec.type !== "string" || rec.type === "") continue;
      if (!validData(rec.data, allowlist)) continue;
      const ev: LocalEvent = { v: 1, seq: events.length, type: rec.type };
      if (rec.data !== undefined) ev.data = { ...(rec.data as Record<string, string | number>) };
      events.push(ev);
    }
    return events;
  } catch {
    return [];
  }
}
