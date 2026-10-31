import { smallerFor, type MisconceptionId, type StepPhase, type StoryData } from "@kids-math/core";

/** Lesson progress snapshot (U11). Pure: no DOM, no I/O.
 *  Serialized with saveProgress, stored in IndexedDB under PROGRESS_KEY. */
export const PROGRESS_KEY = "kids-math-progress";

const MISSES: readonly string[] = ["wrong-operation", "echoed-a-given", "off-by-one",
  "smaller-from-larger", "direction-flip", "unknown"];
const isMiss = (v: unknown): v is MisconceptionId =>
  typeof v === "string" && MISSES.includes(v);

export interface ProgressSnapshot {
  v: 1;
  qIndex: number;
  tag: string;
  rung?: number;
  miss?: string;
  shown?: number;
}

export function saveProgress(input: { qIndex: number; phaseTag: string; rung?: number; miss?: string; shown?: number }): string {
  const snap: ProgressSnapshot = { v: 1, qIndex: input.qIndex, tag: input.phaseTag };
  if (input.rung !== undefined) snap.rung = input.rung;
  if (input.miss !== undefined) snap.miss = input.miss;
  if (input.shown !== undefined) snap.shown = input.shown;
  return JSON.stringify(snap);
}

export function loadProgress(raw: string | null): ProgressSnapshot | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<ProgressSnapshot>;
    if (p.v !== 1 || typeof p.qIndex !== "number" || !Number.isInteger(p.qIndex) || p.qIndex < 0) return null;
    if (typeof p.tag !== "string" || p.tag === "") return null;
    const snap: ProgressSnapshot = { v: 1, qIndex: p.qIndex, tag: p.tag };
    if (typeof p.rung === "number" && Number.isInteger(p.rung) && p.rung >= 0 && p.rung <= 3) snap.rung = p.rung;
    if (isMiss(p.miss)) snap.miss = p.miss;
    if (typeof p.shown === "number" && Number.isInteger(p.shown) && p.shown >= 0) snap.shown = p.shown;
    return snap;
  } catch {
    return null;
  }
}

/** Resume helper: the question index to jump to, or null when nothing resumable. */
export function resumeIndex(raw: string | null): number | null {
  const s = loadProgress(raw);
  return s ? s.qIndex : null;
}

/** Full phase restore for the mount-time override in main.tsx.
 *  Asking and explaining restore directly; reacting restores with its smaller
 *  question derived from the saved misconception, so nothing is re-asked.
 *  Snapshots without a misconception (pre-smaller saves) fall back to
 *  re-asking the same question. Telling, done, and unknown tags are not
 *  resumable (null). */
export function resumePhaseFrom(raw: string | null, story?: StoryData): StepPhase | null {
  const s = loadProgress(raw);
  if (!s) return null;
  if (s.tag === "asking") return { tag: "asking", qIndex: s.qIndex, rung: (s.rung ?? 0) as 0 | 1 | 2 | 3 };
  if (s.tag === "explaining") return { tag: "explaining", qIndex: s.qIndex };
  if (s.tag === "reacting") {
    if (s.miss !== undefined && isMiss(s.miss) && s.shown !== undefined && story
      && s.qIndex < story.questions.length) {
      const found = story.reactions.find((r) => r.misconception === s.miss);
      if (found) {
        const base = story.questions[s.qIndex]!;
        return { tag: "reacting", qIndex: s.qIndex, reaction: { ...found, smaller: smallerFor(found, base) }, shown: s.shown };
      }
    }
    return { tag: "asking", qIndex: s.qIndex, rung: 0 };
  }
  return null;
}

export type ProgressDot = "done" | "current" | "todo";

/** Per-question dots: doneCount answered, current highlighted. */
export function progressDots(total: number, doneCount: number, current: number): ProgressDot[] {
  const dots: ProgressDot[] = [];
  for (let i = 0; i < total; i++) dots.push(i < doneCount ? "done" : i === current ? "current" : "todo");
  return dots;
}
