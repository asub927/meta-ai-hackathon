import { detect, fill, targetFor } from "./core.js";
import { smallerFor } from "./types.js";
import type { Effect, Event, StepPhase, StoryData } from "./types.js";

const say = (line: string): Effect => ({ type: "say", line });

/** Pure Socratic reducer (PLAN.md §2). No DOM, no I/O.
 *  Invariants (formal-verify-socratic-core): tutor never states the answer
 *  before a correct answer; every path can reach done; hints climb 0..3,
 *  rung 3 is the worked example, then the original question is re-asked;
 *  answered events outside `asking` are ignored (double-tap answers once). */
export function step(state: StepPhase, ev: Event, story: StoryData): [StepPhase, Effect[]] {
  const { solved } = story;
  switch (state.tag) {
    case "telling":
      return ev.type === "beat-ended"
        ? [{ tag: "asking", qIndex: 0, rung: 0 }, [say(fill(story.questions[0]!.ask, solved))]]
        : [state, []];
    case "asking": {
      const q = state.smaller ?? story.questions[state.qIndex]!;
      if (ev.type === "hint") {
        if (state.rung >= 3) // worked example already played: re-ask the original question
          return [{ ...state, rung: 0 }, [say(fill(q.ask, solved))]];
        const rung = (state.rung + 1) as 0 | 1 | 2 | 3;
        if (rung === 3) {
          const worked = q.hints[2];
          return [{ ...state, rung }, [say(`${worked.exampleSay} ${fill(worked.say, solved)}`)]];
        }
        return [{ ...state, rung }, [say(fill(state.rung === 1 ? q.hints[1] : q.hints[0], solved))]];
      }
      if (ev.type !== "answered") return [state, []];
      const miss = detect(solved, q, ev.a);
      if (miss === null)
        return [{ tag: "explaining", qIndex: state.qIndex },
          [{ type: "record", event: "answered-clean", template: q.id }, say("How did you know?")]];
      const reaction = story.reactions.find((r) => r.misconception === miss)
        ?? story.reactions.find((r) => r.misconception === "unknown")!;
      const shown = ev.a.kind === "count" ? ev.a.value : targetFor(solved, q);
      return [{ tag: "reacting", qIndex: state.qIndex, reaction, shown },
        [{ type: "react", shown }, say(fill(reaction.pip, solved, { shown }))]];
    }
    case "reacting": {
      if (ev.type !== "reaction-ended") return [state, []];
      const base = story.questions[state.qIndex]!;
      const smaller = smallerFor(state.reaction, base);
      return [{ tag: "asking", qIndex: state.qIndex, rung: 0, smaller },
        [say(fill(smaller.ask, solved))]];
    }
    case "explaining": {
      if (ev.type !== "explained") return [state, []];
      const next = state.qIndex + 1;
      return next >= story.questions.length
        ? [{ tag: "done" }, [{ type: "record", event: "lesson-done" }, say("You worked it out!")]]
        : [{ tag: "asking", qIndex: next, rung: 0 }, [say(fill(story.questions[next]!.ask, solved))]];
    }
    case "done":
      return [state, []];
  }
}
