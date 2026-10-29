import type { BeatScript, Expression } from "./types.js";

export interface BeatFrame {
  expression: Expression;
  bookCount: number;
  say: string | null;
  activeCues: readonly string[];
  done: boolean;
}

/** Pure deterministic BeatScript evaluator (PLAN.md U6). No DOM, no I/O,
 *  no Date, no Math.random. Integer comparisons only; output is JSON-stable. */
export function evaluateBeat(script: BeatScript, tMs: number): BeatFrame {
  const durationMs = script.durationMs;
  const t = durationMs <= 0 ? 0 : Math.min(Math.max(tMs, 0), durationMs);
  const seen: string[] = [];
  for (const cue of script.cues) {
    if (cue.atMs <= t && !seen.includes(cue.kind)) seen.push(cue.kind);
  }
  const sayOn = script.say !== null && script.cues.some((c) => c.kind === "say" && c.atMs <= t);
  return {
    expression: script.expression,
    bookCount: script.bookCount,
    say: sayOn ? script.say : null,
    activeCues: seen,
    done: tMs >= durationMs,
  };
}
