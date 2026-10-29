import { solve } from "./core.js";
import type { StoryData } from "./types.js";

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
        { exampleSay: "7 balloons, 2 pop. Fewer!", say: "Now you try." }],
      explainChoices: ["Giving away makes fewer", "I guessed"],
    },
    {
      id: "q0-count", step: 0, ask: "How many does {hero} have now?", interaction: "count",
      hints: ["How many were there at the start?", "Let's make tens. Take some away.",
        { exampleSay: "12 balloons, 4 pop, leaves 8.", say: "Now you try." }],
      explainChoices: ["I counted back", "I used tens", "I guessed"],
    },
    {
      id: "q1-count", step: "final", ask: "Then {hero} finds more. How many in all?", interaction: "count",
      hints: ["How many after giving some away?", "Count on from there.",
        { exampleSay: "8 shells, find 3, makes 11.", say: "Now you try." }],
      explainChoices: ["I counted on", "I used tens", "I guessed"],
    },
  ],
  reactions: [
    { misconception: "wrong-operation", pip: "If {hero} had {shown}, where did they come from?" },
    { misconception: "echoed-a-given", pip: "{shown} is how many flew away. How many stayed?" },
    { misconception: "smaller-from-larger", pip: "{shown} is more than the start. Did any fly away?" },
    { misconception: "direction-flip", pip: "Did {hero} get more, or give some away?" },
    { misconception: "off-by-one", pip: "So close. Let's count together." },
    { misconception: "unknown", pip: "Let's count together, slowly." },
  ],
  source: { url: "PLAN.md §2 sticker example", licence: "CC BY-SA 4.0", changes: "Original story written for this app." },
};
