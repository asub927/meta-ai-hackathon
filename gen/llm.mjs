// U14 LLM boundary. One function posts to an OpenAI-compatible
// chat-completions endpoint through the project gateway; no provider SDK.
// CI never touches the network: a recorded response under gen/cache/ is
// replayed when present, and GEN_CACHE=replay fails closed when absent.
// Tests inject a fake client instead of this module.

import { promises as fs } from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const CACHE_DIR = path.join(HERE, "cache");

const cachePath = (key) => path.join(CACHE_DIR, `${key}.json`);

export async function readCache(key) {
  try {
    return JSON.parse(await fs.readFile(cachePath(key), "utf8"));
  } catch {
    return null;
  }
}

export async function writeCache(key, value) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(cachePath(key), JSON.stringify(value, null, 2) + "\n");
}

/** Live gateway call. `fetchImpl` is injectable so tests never need sockets. */
export async function gatewayComplete({ model, system, user, maxTokens, temperature, fetchImpl = fetch }) {
  const url = process.env.GEN_GATEWAY_URL;
  const key = process.env.GEN_GATEWAY_KEY;
  if (!url) throw new Error("missing-gateway: set GEN_GATEWAY_URL to the project gateway chat-completions endpoint");
  if (!key) throw new Error("missing-gateway: set GEN_GATEWAY_KEY for that endpoint");
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature, max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`gateway-error: HTTP ${res.status}`);
  const body = await res.json();
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content) throw new Error("gateway-error: empty content");
  return content;
}

/** Complete with the recorded cache. Modes: auto (replay if present, else
 *  live and record), replay (fail when absent), record (live and overwrite). */
export async function completeWithCache({ key, mode = "auto", request, live }) {
  const recorded = await readCache(key);
  if (recorded && mode !== "record") return { text: recorded.content, fromCache: true };
  if (mode === "replay")
    throw new Error(`missing-cache: gen/cache/${key}.json absent and GEN_CACHE=replay`);
  const text = await live(request);
  await writeCache(key, { key, request, content: text });
  return { text, fromCache: false };
}

export function cacheMode() {
  return process.env.GEN_CACHE ?? "auto";
}
