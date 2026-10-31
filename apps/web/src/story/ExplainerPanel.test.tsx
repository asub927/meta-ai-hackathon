import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
// @ts-expect-error @types/node is not installed in this workspace; node:fs exists at runtime under vitest.
import { readFileSync } from "node:fs";
import { ExplainerPanel, panelReducer } from "./ExplainerPanel";

const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

const STEPS = [
  { id: "question", text: "24 take away 9. What is left?" },
  { id: "show-total", text: "Here are 24." },
  { id: "remove", text: "Take away 9. 9 go away." },
  { id: "count-remainder", text: "Count what is left: 15." },
  { id: "summary", text: "24 take away 9 leaves 15." },
] as const;

const QUESTION = "How many does Momo have now?";

describe("panelReducer", () => {
  it("advances exactly one step per next and clamps at the last step", () => {
    let s = { index: 0 };
    s = panelReducer(STEPS.length, s, { type: "next" });
    expect(s.index).toBe(1);
    s = panelReducer(STEPS.length, s, { type: "next" });
    expect(s.index).toBe(2);
    s = panelReducer(STEPS.length, { index: STEPS.length - 1 }, { type: "next" });
    expect(s.index).toBe(STEPS.length - 1);
  });

  it("goes back exactly one step per back and clamps at the first step", () => {
    expect(panelReducer(STEPS.length, { index: 2 }, { type: "back" }).index).toBe(1);
    expect(panelReducer(STEPS.length, { index: 0 }, { type: "back" }).index).toBe(0);
  });
});

describe("ExplainerPanel", () => {
  it("pins the question at top and shows only the current step as plain text", () => {
    const html = renderToStaticMarkup(
      <ExplainerPanel question={QUESTION} steps={[...STEPS]} onDone={() => {}} />,
    );
    expect(html).toContain(QUESTION);
    expect(html.indexOf(QUESTION) < html.indexOf(STEPS[0].text)).toBe(true);
    expect(html).toContain(STEPS[0].text);
    expect(html).not.toContain(STEPS[1].text);
    expect(html).toContain("Step 1 of 5");
  });

  it("shows every step as plain text with no mascot voice in the panel", () => {
    for (let i = 0; i < STEPS.length; i++) {
      const html = renderToStaticMarkup(
        <ExplainerPanel question={QUESTION} steps={[...STEPS]} initialStep={i} onDone={() => {}} />,
      );
      expect(html).toContain(STEPS[i]!.text);
      expect(html).not.toContain("Pip");
      expect(html).not.toContain("puffbun");
    }
  });

  it("offers Try it on the last step instead of Next", () => {
    const html = renderToStaticMarkup(
      <ExplainerPanel question={QUESTION} steps={[...STEPS]} initialStep={STEPS.length - 1} onDone={() => {}} />,
    );
    expect(html).toContain("Try it");
    expect(html).not.toContain(">Next<");
  });

  it("moves with transform and opacity only, and yields to reduced motion", () => {
    const rules = [...css.matchAll(/\.explainer-step\s*\{[^}]*\}/g)].map((m) => m[0]);
    const stepRule = rules.find((r) => r.includes("opacity")) ?? "";
    expect(stepRule).toContain("opacity");
    const transition = stepRule.match(/transition:\s*([^;}]*)/)?.[1] ?? "";
    expect(transition).not.toBe("");
    for (const part of transition.split(",")) {
      expect(["opacity", "transform", "none"]).toContain(part.trim().split(" ")[0]);
    }
    const reduced = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(reduced).toContain(".explainer");
    expect(reduced).toContain("transition: none");
  });
});
