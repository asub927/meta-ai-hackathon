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

/** Live Anthropic Messages call (the harness gateway protocol).
 *  URL falls back to ANTHROPIC_BASE_URL, key to ANTHROPIC_AUTH_TOKEN.
 *  The harness model thinks on every call and rejects thinking-off, so
 *  this reserves the minimum thinking budget (1024) and reads the text
 *  block that follows the redacted thinking block. The model can spend
 *  ~15k thinking tokens on a draft, so live runs need maxTokens far above
 *  the budget (the eval uses GEN_MAX_TOKENS=16000). */
export async function anthropicComplete({ model, system, user, maxTokens, temperature, fetchImpl = fetch }) {
  const base = process.env.GEN_GATEWAY_URL ?? process.env.ANTHROPIC_BASE_URL;
  if (!base) throw new Error("missing-gateway: set GEN_GATEWAY_URL or ANTHROPIC_BASE_URL");
  const url = base.endsWith("/v1/messages") ? base : base.replace(/\/$/, "") + "/v1/messages";
  const key = process.env.GEN_GATEWAY_KEY ?? process.env.ANTHROPIC_AUTH_TOKEN ?? "";
  const res = await fetchImpl(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      ...(key ? { "x-api-key": key } : {}),
    },
    body: JSON.stringify({
      model, max_tokens: maxTokens, temperature,
      thinking: { type: "enabled", budget_tokens: 1024 },
      system, messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`gateway-error: HTTP ${res.status}`);
  const body = await res.json();
  const block = body?.content?.find((b) => b.type === "text");
  if (!block || typeof block.text !== "string" || !block.text)
    throw new Error("gateway-error: empty content");
  return block.text;
}

export function gatewayProtocol() {
  return process.env.GEN_GATEWAY_PROTOCOL ?? "openai";
}

export function cacheMode() {
  return process.env.GEN_CACHE ?? "auto";
}

/** Shared client builder for the CLI and the eval: cache-backed gateway. */
export function buildClient({ model, maxTokens, temperature }) {
  const protocol = gatewayProtocol();
  return async ({ system, user, key }) =>
    (await completeWithCache({
      key, mode: cacheMode(),
      request: { model, protocol, system, user },
      live: (req) => (protocol === "anthropic"
        ? anthropicComplete({ model, system: req.system, user: req.user, maxTokens, temperature })
        : gatewayComplete({ model, system: req.system, user: req.user, maxTokens, temperature })),
    })).text;
}
