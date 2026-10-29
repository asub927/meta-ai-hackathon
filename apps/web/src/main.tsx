import { useEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { choreograph, detect, fill, initial, step, stickerStory as story, type Answer, type BeatScript, type Event, type StepPhase } from "@kids-math/core";
import { playBeat, type BeatHandle } from "./player";
import { createAudioSession } from "./audio/audio";
import { countTogetherSteps, stagingFor } from "./story/react";
import { CountWidget } from "./interact/CountWidget";
import { DragTray } from "./interact/DragTray";
import { hintCueFor } from "./story/hints";
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
  const [, setShown] = useState<number | null>(null);
  const [count, setCount] = useState("");
  const [hintReady, setHintReady] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const [hasLocalVoice, setHasLocalVoice] = useState(true);
  const [log, setLog] = useState<string[]>(loadLog);
  const sessionRef = useRef(createAudioSession(() => new AudioContext()));
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pipRef = useRef<HTMLParagraphElement | null>(null);
  const beatRef = useRef<{ script: BeatScript; handle: BeatHandle } | null>(null);

  useEffect(() => {
    (window as any).audioState = () => sessionRef.current.state();
    (window as any).__cueLog = () => sessionRef.current.cues();
    const onVis = () => { void sessionRef.current.onVisibility(!document.hidden); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  useEffect(() => { (window as any).__render = { seek: (t: number) => {
    const b = beatRef.current;
    if (!b) { document.body.dataset.frame = String(Math.round(t * 30)); return; }
    document.body.dataset.frame = JSON.stringify(b.handle.seek(Math.round(t * 1000)));
  } }; }, []);
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
    if (e.type === "explained") {
      const entry = `strategy:${e.choice}`;
      setLog((l) => { const nl = [...l, entry]; localStorage.setItem(LOG_KEY, JSON.stringify(nl)); return nl; });
    }
    if ((ns.tag === "asking" || ns.tag === "reacting") && stageRef.current && pipRef.current) {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const script = ns.tag === "asking"
        ? choreograph({ reducedMotion }, story.solved, { kind: "beat", question: story.questions[ns.qIndex]! })
        : choreograph({ reducedMotion }, story.solved, { kind: "reaction", reaction: ns.reaction, shown: ns.shown });
      beatRef.current?.handle.cancel();
      for (const c of script.cues) sessionRef.current.logCue(c.kind, c.atMs);
      beatRef.current = { script, handle: playBeat(script, { root: stageRef.current, pip: pipRef.current }) };
    }
    dispatchCore(e);
  };
  const answer = (a: Answer) => send({ type: "answered", a });
  const q = phase.tag === "asking" || phase.tag === "reacting" || phase.tag === "explaining"
    ? story.questions[(phase as { qIndex: number }).qIndex]! : null;
  const staging = phase.tag === "reacting" && q
    ? stagingFor(phase.reaction.misconception, story.solved, q, phase.shown) : null;
  const cue = phase.tag === "asking" && q ? hintCueFor(q, phase.rung, story.solved) : null;
  const bookCount = staging ? staging.bookCount
    : phase.tag === "done" ? story.solved.answer
    : q ? story.solved.totals[q.step === "final" ? story.solved.totals.length - 2 : q.step]! : story.solved.problem.start;
  const startCount = staging ? staging.startCount : story.solved.problem.start;
  const countAlong = staging && q && staging.kind === "count-together"
    ? countTogetherSteps(staging, story.solved, q) : [];

  if (!started) return (
    <main><h1>Kids Math — Socratic Stories</h1><p className="bubble" aria-live="polite">{pip}</p>
      <button onClick={() => { void sessionRef.current.unlock().then(() => setStarted(true)); }}>Start</button></main>
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
      <div className="stage" data-testid="stage" data-staging={staging ? staging.kind : undefined} ref={stageRef}>
        <p className="bubble" aria-live="polite" data-testid="pip" ref={pipRef}>{pip}</p>
        <p data-expression={phase.tag === "reacting" ? "puzzled" : phase.tag === "done" ? "celebrate" : "curious"}>Pip the puffbun</p>
        <div className="counts">
          <span>Start: <b data-testid="start-count">{startCount}</b></span>
          <span>Book: <b data-testid="book-count">{bookCount}</b> stickers</span>
          {staging && <span>Tray: <b data-testid="tray-count">{staging.trayCount}</b></span>}
        </div>
        {staging && <span data-testid="staging-kind">{staging.kind}</span>}
        {staging?.kind === "count-together" && (
          <div className="count-along" aria-label="Count along">
            {countAlong.map((n) => <span key={n} data-testid="count-along">{n}</span>)}
          </div>)}
        {phase.tag === "asking" && q?.interaction === "predict" && (
          <div>{(["more", "fewer", "same"] as const).map((v) => <button key={v} className="predict" onClick={() => answer({ kind: "predict", value: v })}>{v}</button>)}</div>)}
        {phase.tag === "asking" && q?.interaction === "count" && (
          <div>
            <div data-testid="count-input-wrap"><label>How many? <input data-testid="count-input" type="number" value={count} onChange={(e) => setCount(e.target.value)} /></label>
              <button onClick={() => { if (count !== "") answer({ kind: "count", value: Number(count) }); }}>Answer</button></div>
            <CountWidget key={`count-${q.id}`} onAnswer={answer} />
            <DragTray key={`drag-${q.id}`} total={story.solved.totals[q.step === "final" ? story.solved.totals.length - 2 : q.step]!} onAnswer={answer} />
          </div>)}
        {phase.tag === "asking" && hintReady && <button className="secondary" onClick={() => send({ type: "hint" })}>Hint</button>}
        {phase.tag === "asking" && cue && (
          <div className="hint-cue" data-testid="hint-cue" data-cue-kind={cue.kind}>
            {cue.kind === "ten-frame" && cue.tenFrame && (
              <div className="ten-frame" aria-label="Ten frame">
                {Array.from({ length: cue.tenFrame.full }, (_, r) => (
                  <div className="ten-frame-row" key={`full-${r}`}>
                    {Array.from({ length: 10 }, (_, i) => <span className="ten-frame-dot" data-testid="ten-frame-dot" key={i} />)}
                  </div>))}
                {cue.tenFrame.partial > 0 && (
                  <div className="ten-frame-row" key="partial">
                    {Array.from({ length: cue.tenFrame.partial }, (_, i) => <span className="ten-frame-dot" data-testid="ten-frame-dot" key={i} />)}
                  </div>)}
              </div>)}
            {cue.kind === "worked" && (
              <div className="worked-example" data-testid="worked-example">
                <div className="worked-chips">
                  {cue.workedNumbers?.map((n, i) => <span className="worked-chip" data-testid="worked-chip" key={i}>{n}</span>)}
                </div>
                <p>{cue.say}</p>
              </div>)}
            {cue.kind !== "ten-frame" && cue.kind !== "worked" && <p>{cue.say}</p>}
          </div>)}
        {phase.tag === "reacting" && <button onClick={() => send({ type: "reaction-ended" })}>Keep going</button>}
        {phase.tag === "explaining" && q && <div><p>How did you know?</p>
          {q.explainChoices.map((c) => <button key={c} className="secondary" onClick={() => send({ type: "explained", choice: c })}>{c}</button>)}</div>}
        {phase.tag === "done" && <p data-testid="done">Lesson finished! You worked it out!</p>}
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
