export type AudioState = "locked" | "running" | "suspended" | "interrupted" | "closed";

export interface AudioLike {
  state: string;
  resume(): Promise<void>;
}

export interface CueEntry {
  name: string;
  atMs: number;
}

export function mapState(s: string): AudioState {
  switch (s) {
    case "running":
      return "running";
    case "suspended":
      return "suspended";
    case "interrupted":
      return "interrupted";
    case "closed":
      return "closed";
    default:
      return "locked";
  }
}

export interface AudioSession {
  unlock(): Promise<AudioState>;
  state(): AudioState;
  onVisibility(visible: boolean): Promise<void>;
  handleStateChange(): AudioState;
  logCue(name: string, atMs?: number): void;
  cues(): CueEntry[];
}

export type DuckState = "full" | "ducked";

export const FULL_GAIN = 1;
export const DUCKED_GAIN = 0.2;

export interface MusicDuck {
  state(): DuckState;
  level(): number;
  duck(): void;
  unduck(): void;
}

export function createMusicDuck(apply: (level: number) => void = () => {}): MusicDuck {
  let state: DuckState = "full";
  return {
    state: () => state,
    level: () => (state === "ducked" ? DUCKED_GAIN : FULL_GAIN),
    duck: () => {
      if (state === "ducked") return;
      state = "ducked";
      apply(DUCKED_GAIN);
    },
    unduck: () => {
      if (state === "full") return;
      state = "full";
      apply(FULL_GAIN);
    },
  };
}
/** Framework-free AudioContext lifecycle wrapper.
 *  No DOM globals inside; the context factory is injected so unit
 *  tests can pass plain fakes. Cue timing defaults to Date.now. */
export function createAudioSession(
  factory: () => AudioLike,
  now: () => number = Date.now,
): AudioSession {
  let ctx: AudioLike | null = null;
  const cueLog: CueEntry[] = [];

  function readState(): AudioState {
    if (!ctx) return "locked";
    return mapState(ctx.state);
  }

  return {
    async unlock(): Promise<AudioState> {
      if (!ctx) ctx = factory();
      await ctx.resume();
      return readState();
    },
    state(): AudioState {
      return readState();
    },
    async onVisibility(visible: boolean): Promise<void> {
      if (!visible || !ctx) return;
      const s = mapState(ctx.state);
      if (s === "suspended" || s === "interrupted") {
        await ctx.resume();
      }
    },
    handleStateChange(): AudioState {
      return readState();
    },
    logCue(name: string, atMs?: number): void {
      cueLog.push({ name, atMs: atMs ?? now() });
    },
    cues(): CueEntry[] {
      return [...cueLog];
    },
  };
}
