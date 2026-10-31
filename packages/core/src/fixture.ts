import { solve } from "./core.js";
import type { StoryData } from "./types.js";
import { smallerTemplate } from "./types.js";

/** Rung-3 explainer for the sticker story: the give step retraced as a
 *  take-away derivation (24 − 9 = 15). Matches deriveExplainer output. */
const takeAway24_9 = {
  type: "take-away",
  params: { minuend: 24, subtrahend: 9 },
  steps: [
    { id: "question", text: "24 take away 9. What is left?" },
    { id: "show-total", text: "Here are 24." },
    { id: "remove", text: "Take away 9. 9 go away." },
    { id: "count-remainder", text: "Count what is left: 15." },
    { id: "summary", text: "24 take away 9 leaves 15." },
  ],
} as const;

/** Sticker demo from PLAN.md §2: 24 - 9 + 5 = 20, totals [24, 15, 20]. */
export const stickerStory: StoryData = {
  solved: solve({
    id: "stickers-24-9-5", standard: "NC.2.OA.1", hero: "Momo", friend: "Kiwi",
    item: "sticker", start: 24,
    steps: [{ kind: "give", n: 9, to: "Kiwi" }, { kind: "find", n: 5, place: "bed" }],
  }),
  questions: [
    {
      id: "q0-predict", step: 0, ask: "{hero} gives some away. More or fewer now?", interaction: "predict",
      hints: ["When you give some away, do you keep them?", "Watch the ones that fly.",
        takeAway24_9],
      explainChoices: ["Giving away makes fewer", "I guessed"],
    },
    {
      id: "q0-count", step: 0, ask: "How many does {hero} have now?", interaction: "count",
      hints: ["How many were there at the start?", "Let's make tens. Take some away.",
        takeAway24_9],
      explainChoices: ["I counted back", "I used tens", "I guessed"],
    },
    {
      id: "q1-count", step: "final", ask: "Then {hero} finds more. How many in all?", interaction: "count",
      hints: ["How many after giving some away?", "Count on from there.",
        takeAway24_9],
      explainChoices: ["I counted on", "I used tens", "I guessed"],
    },
  ],
  reactions: [
    { misconception: "wrong-operation", pip: "If {hero} had {shown}, where did they come from?", smaller: smallerTemplate("wrong-operation") },
    { misconception: "echoed-a-given", pip: "{shown} is how many flew away. How many stayed?", smaller: smallerTemplate("echoed-a-given") },
    { misconception: "smaller-from-larger", pip: "{shown} is more than the start. Did any fly away?", smaller: smallerTemplate("smaller-from-larger") },
    { misconception: "direction-flip", pip: "Did {hero} get more, or give some away?", smaller: smallerTemplate("direction-flip") },
    { misconception: "off-by-one", pip: "So close. Let's count together.", smaller: smallerTemplate("off-by-one") },
    { misconception: "unknown", pip: "Let's count together, slowly.", smaller: smallerTemplate("unknown") },
  ],
  source: { url: "PLAN.md §2 sticker example", licence: "CC BY-SA 4.0", changes: "Original story written for this app." },
};
