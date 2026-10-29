import type { StepPhase } from "@kids-math/core";

/** Lesson progress snapshot (U11). Pure: no DOM, no I/O.
 *  Serialized with saveProgress, stored in localStorage under PROGRESS_KEY. */
export const PROGRESS_KEY = "kids-math-progress";

export interface ProgressSnapshot {
  v: 1;
  qIndex: number;
  tag: string;
  rung?: number;
}

export function saveProgress(input: { qIndex: number; phaseTag: string; rung?: number }): string {
  const snap: ProgressSnapshot = { v: 1, qIndex: input.qIndex, tag: input.phaseTag };
  if (input.rung !== undefined) snap.rung = input.rung;
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
 *  Asking and explaining restore directly; reacting cannot rebuild its
 *  reaction object, so it falls back to re-asking the same question.
 *  Telling, done, and unknown tags are not resumable (null). */
export function resumePhaseFrom(raw: string | null): StepPhase | null {
  const s = loadProgress(raw);
  if (!s) return null;
  if (s.tag === "asking") return { tag: "asking", qIndex: s.qIndex, rung: (s.rung ?? 0) as 0 | 1 | 2 | 3 };
  if (s.tag === "explaining") return { tag: "explaining", qIndex: s.qIndex };
  if (s.tag === "reacting") return { tag: "asking", qIndex: s.qIndex, rung: 0 };
  return null;
}

export type ProgressDot = "done" | "current" | "todo";

/** Per-question dots: doneCount answered, current highlighted. */
export function progressDots(total: number, doneCount: number, current: number): ProgressDot[] {
  const dots: ProgressDot[] = [];
  for (let i = 0; i < total; i++) dots.push(i < doneCount ? "done" : i === current ? "current" : "todo");
  return dots;
}
