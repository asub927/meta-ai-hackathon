import { evaluateBeat, type BeatFrame, type BeatScript } from "@kids-math/core";

export interface BeatEls {
  root: HTMLElement;
  pip: HTMLElement;
}

export interface BeatHandle {
  seek(tMs: number): BeatFrame;
  cancel(): void;
}

/** Thin WAAPI adapter over the pure BeatScript evaluator (PLAN.md U6).
 *  All state decisions come from evaluateBeat; WAAPI is only a subtle
 *  entrance on the pip bubble. Reduced-motion (or zero-duration) scripts
 *  skip animation entirely and apply final state instantly. */
export function playBeat(script: BeatScript, els: BeatEls): BeatHandle {
  let anim: Animation | null = null;
  if (!script.reducedMotion && script.durationMs > 0 && typeof els.pip.animate === "function") {
    anim = els.pip.animate(
      [
        { opacity: "0", transform: "translateY(4px)" },
        { opacity: "1", transform: "translateY(0)" },
      ],
      { duration: 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
  }
  return {
    seek(tMs: number): BeatFrame {
      const frame = evaluateBeat(script, tMs);
      els.pip.textContent = frame.say ?? "";
      els.root.dataset.bookCount = String(frame.bookCount);
      els.root.dataset.expression = frame.expression;
      return frame;
    },
    cancel(): void {
      anim?.cancel();
      anim = null;
    },
  };
}
