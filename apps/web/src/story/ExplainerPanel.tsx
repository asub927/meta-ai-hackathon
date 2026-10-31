import { useReducer } from "react";
import type { WorkedExplainerStep } from "@kids-math/core";

export interface ExplainerPanelState { index: number }
export type ExplainerPanelAction = { type: "next" } | { type: "back" };

/** One idea per step: exactly one step per tap, clamped at both ends. */
export function panelReducer(
  stepCount: number, state: ExplainerPanelState, action: ExplainerPanelAction,
): ExplainerPanelState {
  if (action.type === "next") return { index: Math.min(state.index + 1, stepCount - 1) };
  return { index: Math.max(state.index - 1, 0) };
}

/** Rung-3 worked example explainer (docs/WORKED-EXAMPLE-EXPLAINER.md): the
 *  question stays pinned at top, each step is plain text for VoiceOver, no
 *  mascots appear, and the last step hands back to the re-asked question. */
export function ExplainerPanel({ question, steps, initialStep = 0, onDone }: {
  question: string;
  steps: readonly WorkedExplainerStep[];
  initialStep?: number;
  onDone: () => void;
}) {
  const [state, dispatch] = useReducer(
    (s: ExplainerPanelState, a: ExplainerPanelAction) => panelReducer(steps.length, s, a),
    { index: Math.min(Math.max(initialStep, 0), steps.length - 1) },
  );
  const last = state.index >= steps.length - 1;
  return (
    <section className="explainer" data-testid="explainer-panel" aria-label="Worked example">
      <p className="explainer-question" data-testid="explainer-question">{question}</p>
      <p className="explainer-step" data-testid="explainer-step" key={state.index} aria-live="polite">
        {steps[state.index]!.text}
      </p>
      <p className="explainer-progress" data-testid="explainer-progress">
        Step {state.index + 1} of {steps.length}
      </p>
      <div className="explainer-nav">
        <button className="secondary" data-testid="explainer-back" disabled={state.index === 0}
          onClick={() => dispatch({ type: "back" })}>Back</button>
        {last
          ? <button data-testid="explainer-done" onClick={onDone}>Try it</button>
          : <button data-testid="explainer-next" onClick={() => dispatch({ type: "next" })}>Next</button>}
      </div>
    </section>
  );
}
