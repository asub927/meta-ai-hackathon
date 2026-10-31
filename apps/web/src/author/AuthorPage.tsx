import { useMemo, useState } from "react";
import { fill } from "@kids-math/core";
import {
  ALL_MISCONCEPTIONS,
  AUTHOR_KINDS,
  AUTHOR_STANDARDS,
  buildLesson,
  defaultDraft,
  draftIssues,
  validateDraftStory,
  type AuthorDraft,
  type AuthorKind,
  type MisconceptionId,
} from "./author";

function num(v: string, fallback: number): number {
  const n = Number(v);
  return v.trim() === "" || !Number.isFinite(n) ? fallback : Math.floor(n);
}

function NumberField({ testid, label, value, set }: {
  testid: string; label: string; value: number; set: (n: number) => void;
}) {
  return (
    <label>{label} <input data-testid={testid} type="number" min={0} max={100} value={value}
      onChange={(e) => set(num(e.target.value, value))} /></label>
  );
}

/** U15a authoring page: offline, no account. The teacher picks a standard and
 *  enters a problem; solve() derives every number in the live preview and the
 *  downloaded CC BY-SA lesson file. Served at #/author, beside the game. */
export function AuthorPage() {
  const [draft, setDraft] = useState<AuthorDraft>(defaultDraft);
  const set = (patch: Partial<AuthorDraft>): void => setDraft((d) => ({ ...d, ...patch }));
  const toggleMiss = (id: MisconceptionId): void =>
    setDraft((d) => ({
      ...d,
      misconceptions: d.misconceptions.includes(id)
        ? d.misconceptions.filter((m) => m !== id)
        : [...d.misconceptions, id],
    }));

  const inputProblems = useMemo(() => draftIssues(draft), [draft]);
  const story = useMemo(() => {
    if (inputProblems.length > 0) return null;
    try {
      return buildLesson(draft).stories[0] ?? null;
    } catch {
      return null;
    }
  }, [draft, inputProblems]);
  const validatorProblems = useMemo(
    () => (story ? validateDraftStory(draft) : []),
    [story, draft],
  );
  const output = useMemo(
    () => (story ? `${JSON.stringify({ id: draft.lessonId, standard: draft.standard, stories: [story] }, null, 2)}\n` : null),
    [story, draft],
  );
  const problems = [...inputProblems, ...validatorProblems.map((i) => `${i.code} at ${i.path}`)];

  const download = (): void => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${draft.lessonId}.lesson.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <main>
      <h1>Author a lesson</h1>
      <p>Offline draft tool. You enter the story, the solver fills every number.</p>
      <label>NCDPI standard <select data-testid="author-standard" value={draft.standard}
        onChange={(e) => set({ standard: e.target.value })}>
        {AUTHOR_STANDARDS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select></label>
      <label>Lesson id <input data-testid="author-lesson-id" value={draft.lessonId}
        onChange={(e) => set({ lessonId: e.target.value })} /></label>
      <label>Hero <input data-testid="author-hero" value={draft.hero} maxLength={10}
        onChange={(e) => set({ hero: e.target.value })} /></label>
      <label>Friend <input data-testid="author-friend" value={draft.friend} maxLength={10}
        onChange={(e) => set({ friend: e.target.value })} /></label>
      <label>Things <input data-testid="author-item" value={draft.item} maxLength={10}
        onChange={(e) => set({ item: e.target.value })} /></label>
      <label>Story kind <select data-testid="author-kind" value={draft.kind}
        onChange={(e) => set({ kind: e.target.value as AuthorKind })}>
        {AUTHOR_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
      </select></label>
      {(draft.kind === "take-from-result" || draft.kind === "add-to-result" || draft.kind === "two-step") && (
        <NumberField testid="author-start" label="Start with" value={draft.start} set={(n) => set({ start: n })} />)}
      {(draft.kind === "take-from-result" || draft.kind === "take-from-start") && (
        <NumberField testid="author-change" label="Gave away" value={draft.change} set={(n) => set({ change: n })} />)}
      {(draft.kind === "add-to-result" || draft.kind === "add-to-start") && (
        <NumberField testid="author-change" label="Received" value={draft.change} set={(n) => set({ change: n })} />)}
      {draft.kind === "two-step" && (
        <NumberField testid="author-change" label="Found" value={draft.change} set={(n) => set({ change: n })} />)}
      {draft.kind === "two-step" && (
        <NumberField testid="author-change2" label="Gave away" value={draft.secondChange} set={(n) => set({ secondChange: n })} />)}
      {(draft.kind === "take-from-start" || draft.kind === "add-to-start") && (
        <NumberField testid="author-result" label="Ended with" value={draft.result} set={(n) => set({ result: n })} />)}
      {draft.kind.startsWith("compare") && (<>
        <NumberField testid="author-reference" label="Other pile" value={draft.reference} set={(n) => set({ reference: n })} />
        <NumberField testid="author-difference" label={draft.kind === "compare-bigger" ? "Extra" : "Fewer by"}
          value={draft.difference} set={(n) => set({ difference: n })} />
      </>)}
      <fieldset>
        <legend>Misconceptions Pip answers</legend>
        {ALL_MISCONCEPTIONS.map((m) => (
          <label key={m.id}><input type="checkbox" data-testid={`author-miss-${m.id}`}
            checked={draft.misconceptions.includes(m.id)} onChange={() => toggleMiss(m.id)} /> {m.label}</label>
        ))}
      </fieldset>
      <section aria-label="Live preview">
        <h2>Preview</h2>
        {story ? (<>
          <p data-testid="author-preview">Totals {story.solved.totals.join(", ")}. Answer {story.solved.answer}.</p>
          <ul data-testid="author-questions">{story.questions.map((qq) => <li key={qq.id}>{fill(qq.ask, story.solved)}</li>)}</ul>
        </>) : <p data-testid="author-preview">Fix the problems below to see the preview.</p>}
      </section>
      <p data-testid="author-status">{problems.length === 0 ? "Lesson ready" : problems.join(" ")}</p>
      {output && (<>
        <button data-testid="author-download" onClick={download}>Download lesson file (CC BY-SA 4.0)</button>
        <pre data-testid="author-output">{output}</pre>
      </>)}
    </main>
  );
}
