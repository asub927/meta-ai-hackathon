import { useEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { choreograph, detect, fill, initial, step, stickerStory as story, type Answer, type Event, type StepPhase } from "@kids-math/core";
import "./index.css";

const LOG_KEY = "kids-math-log";
const loadLog = (): string[] => { try { return JSON.parse(localStorage.getItem(LOG_KEY) ?? "[]"); } catch { return []; } };

function speakLocal(text: string) {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const local = voices.filter((v) => v.localService);
  if (!local.length || !("SpeechSynthesisUtterance" in window)) return false;
  const u = new SpeechSynthesisUtterance(text);
  try { u.voice = local[0]!; } catch { return false; } // a voice object the browser rejects is not spoken remotely
  window.speechSynthesis.speak(u); return true;
}

function App() {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [phase, dispatchCore] = useReducer((s: StepPhase, e: Event) => step(s, e, story)[0], initial);
  const [pip, setPip] = useState("Hi! I am Pip. Want a story?");
  const [shown, setShown] = useState<number | null>(null);
  const [count, setCount] = useState("");
  const [hintReady, setHintReady] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const [hasLocalVoice, setHasLocalVoice] = useState(true);
  const [log, setLog] = useState<string[]>(loadLog);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => { (window as any).__render = { seek: (t: number) => { document.body.dataset.frame = String(Math.round(t * 30)); } }; }, []);
  useEffect(() => {
    (window as any).__conformanceRun = (kind: string, input: any) => {
      if (kind === "step") {
        const [state, effects] = step(input.state, input.event, story);
        return { state, effects };
      }
      if (kind === "detect") return detect(story.solved, story.questions[input.qIndex]!, input.answer);
      if (kind === "fill") return fill(input.template, story.solved, input.extra ?? {});
      if (kind === "choreograph") {
        const resolved = input.beat.kind === "beat"
          ? { kind: "beat" as const, question: story.questions[input.beat.qIndex]! }
          : {
            kind: "reaction" as const,
            reaction: story.reactions.find((r) => r.misconception === input.beat.misconception)!,
            shown: input.beat.shown,
          };
        return choreograph(input.scene, story.solved, resolved);
      }
      throw new Error(`unknown conformance kind: ${kind}`);
    };
  }, []);
  useEffect(() => { setHasLocalVoice((window.speechSynthesis?.getVoices() ?? []).some((v) => v.localService)); }, [started]);
  useEffect(() => { if (phase.tag === "asking") { setShown(null); const t = setTimeout(() => setHintReady(true), 8000); return () => clearTimeout(t); } }, [phase]);
  useEffect(() => { if (readAloud) speakLocal(pip); }, [pip, readAloud]);

  const send = (e: Event) => {
    const [ns, fx] = step(phase, e, story);
    for (const f of fx) {
      if (f.type === "say") setPip(f.line);
      if (f.type === "react") setShown(f.shown);
      if (f.type === "record") setLog((l) => { const nl = [...l, f.event]; localStorage.setItem(LOG_KEY, JSON.stringify(nl)); return nl; });
    }
    if (ns.tag === "reacting") setHintReady(true);
    dispatchCore(e);
  };
  const answer = (a: Answer) => send({ type: "answered", a });
  const q = phase.tag === "asking" || phase.tag === "reacting" || phase.tag === "explaining"
    ? story.questions[(phase as { qIndex: number }).qIndex]! : null;
  const bookCount = phase.tag === "reacting" ? shown ?? 0
    : phase.tag === "done" ? story.solved.answer
    : q ? story.solved.totals[q.step === "final" ? story.solved.totals.length - 2 : q.step]! : story.solved.problem.start;

  if (!started) return (
    <main><h1>Kids Math — Socratic Stories</h1><p className="bubble" aria-live="polite">{pip}</p>
      <button onClick={() => { audioRef.current ??= new AudioContext(); void audioRef.current.resume(); setStarted(true); }}>Start</button></main>
  );
  if (!playing) return (
    <main><h1>Pick a lesson</h1>
      <button onClick={() => { setPlaying(true); send({ type: "beat-ended" }); }}>Lesson 1: Stickers (NC.2.OA.1)</button>
      {hasLocalVoice && <label><input type="checkbox" checked={readAloud} onChange={(e) => setReadAloud(e.target.checked)} /> Read-aloud</label>}
      <section aria-label="Parent gate"><h2>Parents</h2>
        <p>Events on this device: <span data-testid="log-count">{log.length}</span></p>
        <button className="secondary" onClick={() => {
          const blob = new Blob([log.join("\n")], { type: "application/x-ndjson" });
          const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "kids-math-log.ndjson"; a.click();
        }}>Export log</button>
      </section></main>
  );
  return (
    <main>
      <div className="stage" data-testid="stage">
        <p className="bubble" aria-live="polite" data-testid="pip">{pip}</p>
        <p data-expression={phase.tag === "reacting" ? "puzzled" : phase.tag === "done" ? "celebrate" : "curious"}>Pip the puffbun</p>
        <div className="counts">
          <span>Start: <b data-testid="start-count">{story.solved.problem.start}</b></span>
          <span>Book: <b data-testid="book-count">{bookCount}</b> stickers</span>
          {phase.tag === "reacting" && <span>Tray: <b data-testid="tray-count">9</b></span>}
        </div>
        {phase.tag === "asking" && q?.interaction === "predict" && (
          <div>{(["more", "fewer", "same"] as const).map((v) => <button key={v} onClick={() => answer({ kind: "predict", value: v })}>{v}</button>)}</div>)}
        {phase.tag === "asking" && q?.interaction === "count" && (
          <div><label>How many? <input data-testid="count-input" type="number" value={count} onChange={(e) => setCount(e.target.value)} /></label>
            <button onClick={() => { if (count !== "") answer({ kind: "count", value: Number(count) }); }}>Answer</button></div>)}
        {phase.tag === "asking" && hintReady && <button className="secondary" onClick={() => send({ type: "hint" })}>Hint</button>}
        {phase.tag === "reacting" && <button onClick={() => send({ type: "reaction-ended" })}>Keep going</button>}
        {phase.tag === "explaining" && q && <div><p>How did you know?</p>
          {q.explainChoices.map((c) => <button key={c} className="secondary" onClick={() => send({ type: "explained", choice: c })}>{c}</button>)}</div>}
        {phase.tag === "done" && <p data-testid="done">Lesson finished! You worked it out!</p>}
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
