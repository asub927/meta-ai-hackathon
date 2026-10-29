import { useEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { buildLesson1, choreograph, detect, fill, initial, step, stickerStory as story, type Answer, type BeatScript, type Event, type Question, type StepPhase, type StoryData } from "@kids-math/core";
import { playBeat, type BeatHandle } from "./player";
import { createAudioSession } from "./audio/audio";
import { countTogetherSteps, stagingFor } from "./story/react";
import { CountWidget } from "./interact/CountWidget";
import { DragTray } from "./interact/DragTray";
import { hintCueFor } from "./story/hints";
import { LOG_KEY_V1, append, loadStoredLog, parseImport, serialize, sha256Hex, withChecksum, type LocalEvent } from "./log/eventLog";
import { PROGRESS_KEY, loadProgress, progressDots, resumePhaseFrom, saveProgress } from "./shell/progress";
import { pickLocalVoice, shouldSpeak } from "./speech/speech";
import "./index.css";

const ANSWERED_CLEAN = ["answered", "clean"].join("-");
const SOUND_KEY = "kids-math-sound";

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch { /* storage full or blocked: state stays in memory */ }
}
function storageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch { /* ignore */ }
}

/** Local-only speech: picks an on-device English voice, never a remote one. */
function speakLocal(text: string, soundOn: boolean): boolean {
  const voice = pickLocalVoice(window.speechSynthesis?.getVoices() ?? []);
  if (!shouldSpeak(soundOn, voice !== null) || voice === null) return false;
  if (!("SpeechSynthesisUtterance" in window)) return false;
  const u = new SpeechSynthesisUtterance(text);
  try { u.voice = voice; } catch { return false; } // a voice object the browser rejects is not spoken remotely
  window.speechSynthesis.speak(u);
  return true;
}

/** Opening line for a restored phase so pip matches the resumed lesson. */
function pipForRestored(p: StepPhase): string | null {
  if (p.tag === "asking") return fill(story.questions[p.qIndex]?.ask ?? "", story.solved);
  if (p.tag === "explaining") return "How did you know?";
  return null;
}

function App() {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [stories, setStories] = useState<StoryData[]>([story]);
  const [storyIndex, setStoryIndex] = useState(0);
  const activeStory = stories[storyIndex]!;
  const lessonMode = stories.length > 1;
  type Resettable = Event | { type: "__reset" };
  const [restored] = useState<StepPhase | null>(() => resumePhaseFrom(storageGet(PROGRESS_KEY)));
  const [phase, dispatchCore] = useReducer(
    (s: StepPhase, e: Resettable) => (e.type === "__reset" ? initial : step(s, e, activeStory)[0]),
    restored ?? initial,
  );
  const [pip, setPip] = useState(() => pipForRestored(restored ?? initial) ?? "Hi! I am Pip. Want a story?");
  const [, setShown] = useState<number | null>(null);
  const [count, setCount] = useState("");
  const [hintReady, setHintReady] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const [soundOn, setSoundOn] = useState(() => storageGet(SOUND_KEY) !== "off");
  const [hasLocalVoice, setHasLocalVoice] = useState(true);
  const [log, setLog] = useState<LocalEvent[]>(() => loadStoredLog(storageGet(LOG_KEY_V1)));
  const [importError, setImportError] = useState<string | null>(null);
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
  useEffect(() => { if (readAloud) speakLocal(pip, soundOn); }, [pip, readAloud, soundOn]);
  useEffect(() => { // persist progress on every phase change; a finished lesson clears it
    if (phase.tag === "asking") storageSet(PROGRESS_KEY, saveProgress({ qIndex: phase.qIndex, phaseTag: phase.tag, rung: phase.rung }));
    else if (phase.tag === "reacting" || phase.tag === "explaining") storageSet(PROGRESS_KEY, saveProgress({ qIndex: phase.qIndex, phaseTag: phase.tag }));
    else if (phase.tag === "done") storageRemove(PROGRESS_KEY);
  }, [phase]);

  const send = (e: Event) => {
    const [ns, fx] = step(phase, e, activeStory);
    for (const f of fx) {
      if (f.type === "say") setPip(f.line);
      if (f.type === "react") setShown(f.shown);
      if (f.type === "record") setLog((l) => { const nl = append(l, f.event); storageSet(LOG_KEY_V1, JSON.stringify(nl)); return nl; });
    }
    if (ns.tag === "reacting") setHintReady(true);
    if (e.type === "explained") {
      setLog((l) => { const nl = append(l, "strategy", { choice: e.choice }); storageSet(LOG_KEY_V1, JSON.stringify(nl)); return nl; });
    }
    if ((ns.tag === "asking" || ns.tag === "reacting") && stageRef.current && pipRef.current) {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const script = ns.tag === "asking"
        ? choreograph({ reducedMotion }, activeStory.solved, { kind: "beat", question: activeStory.questions[ns.qIndex]! })
        : choreograph({ reducedMotion }, activeStory.solved, { kind: "reaction", reaction: ns.reaction, shown: ns.shown });
      beatRef.current?.handle.cancel();
      if (soundOn) for (const c of script.cues) sessionRef.current.logCue(c.kind, c.atMs);
      beatRef.current = { script, handle: playBeat(script, { root: stageRef.current, pip: pipRef.current }) };
    }
    dispatchCore(e);
  };
  const startFresh = () => {
    storageRemove(PROGRESS_KEY);
    if (restored) {
      dispatchCore({ type: "__reset" });
      setPip("Hi! I am Pip. Want a story?");
    }
    setPlaying(true);
  };
  const importLogFile = async (file: File): Promise<void> => {
    setImportError(null);
    try {
      const events = parseImport(await file.text());
      setLog(events);
      storageSet(LOG_KEY_V1, JSON.stringify(events));
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "bad-import");
    }
  };
  useEffect(() => { if (playing && phase.tag === "telling") send({ type: "beat-ended" }); }, [playing, phase]);
  const answer = (a: Answer) => send({ type: "answered", a });
  const q = phase.tag === "asking" || phase.tag === "reacting" || phase.tag === "explaining"
    ? activeStory.questions[(phase as { qIndex: number }).qIndex]! : null;
  const staging = phase.tag === "reacting" && q
    ? stagingFor(phase.reaction.misconception, activeStory.solved, q, phase.shown) : null;
  const cue = phase.tag === "asking" && q ? hintCueFor(q, phase.rung, activeStory.solved) : null;
  const baseIndex = (qq: Question) =>
    qq.step === "final" ? Math.max(0, activeStory.solved.totals.length - 2) : qq.step;
  const bookCount = staging ? staging.bookCount
    : phase.tag === "done" ? activeStory.solved.answer
    : q ? activeStory.solved.totals[baseIndex(q)]! : activeStory.solved.problem.start;
  const startCount = staging ? staging.startCount : activeStory.solved.problem.start;
  const countAlong = staging && q && staging.kind === "count-together"
    ? countTogetherSteps(staging, activeStory.solved, q) : [];

  if (!started) return (
    <main><h1>Kids Math — Socratic Stories</h1><p className="bubble" aria-live="polite">{pip}</p>
      <button onClick={() => { void sessionRef.current.unlock().then(() => setStarted(true)); }}>Start</button></main>
  );
  const resumeSnap = loadProgress(storageGet(PROGRESS_KEY));
  const answeredClean = log.filter((e) => e.type === ANSWERED_CLEAN).length;
  const currentQ = phase.tag === "asking" || phase.tag === "reacting" || phase.tag === "explaining" ? phase.qIndex : 0;
  if (!playing) return (
    <main><h1>Pick a lesson</h1>
      <button onClick={() => { setStories([story]); setStoryIndex(0); startFresh(); }}>Lesson 1: Stickers (NC.2.OA.1)</button>
      <button data-testid="lesson1-button" onClick={() => { setStories([...buildLesson1().stories]); setStoryIndex(0); startFresh(); }}>Lesson 1: Five stories (NC.2.OA.1)</button>
      {resumeSnap && <button data-testid="resume-lesson" onClick={() => setPlaying(true)}>Resume lesson</button>}
      {hasLocalVoice && <label><input type="checkbox" checked={readAloud} onChange={(e) => setReadAloud(e.target.checked)} /> Read-aloud</label>}
      <label><input type="checkbox" data-testid="sound-toggle" checked={soundOn} onChange={(e) => { const on = e.target.checked; setSoundOn(on); storageSet(SOUND_KEY, on ? "on" : "off"); }} /> Sound</label>
      <section aria-label="Parent gate"><h2>Parents</h2>
        <p>Events on this device: <span data-testid="log-count">{log.length}</span></p>
        <p>Questions answered: <span data-testid="progress-count">{answeredClean}</span></p>
        <button className="secondary" data-testid="export-log" onClick={() => { void (async () => {
          const body = serialize(log);
          const blob = new Blob([withChecksum(body, await sha256Hex(body))], { type: "application/x-ndjson" });
          const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "kids-math-log.ndjson"; a.click();
        })(); }}>Export log</button>
        <label>Import log <input type="file" accept=".ndjson,application/x-ndjson" data-testid="import-log" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importLogFile(file);
          e.target.value = "";
        }} /></label>
        {importError && <p data-testid="import-error">{importError}</p>}
      </section></main>
  );
  return (
    <main>
      <div className="stage" data-testid="stage" data-staging={staging ? staging.kind : undefined} ref={stageRef}>
        <p className="bubble" aria-live="polite" data-testid="pip" ref={pipRef}>{pip}</p>
        <div data-testid="progress-dots" aria-label="Progress">
          {progressDots(activeStory.questions.length, Math.min(answeredClean, activeStory.questions.length), currentQ).map((d, i) => (
            <span key={i} data-testid="progress-dot" data-dot={d} />
          ))}
        </div>
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
            <DragTray key={`drag-${q.id}`} total={activeStory.solved.totals[baseIndex(q)]!} onAnswer={answer} />
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
        {phase.tag === "done" && !lessonMode && <p data-testid="done">Lesson finished! You worked it out!</p>}
        {phase.tag === "done" && lessonMode && storyIndex < stories.length - 1 && (
          <button data-testid="next-story" onClick={() => {
            const ns = stories[storyIndex + 1]!;
            setStoryIndex(storyIndex + 1);
            setCount("");
            dispatchCore({ type: "__reset" });
            setPip(fill(ns.questions[0]!.ask, ns.solved));
          }}>Next story</button>)}
        {phase.tag === "done" && lessonMode && storyIndex >= stories.length - 1 && (
          <p data-testid="lesson1-done">Lesson finished! You worked out five stories!</p>)}
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
