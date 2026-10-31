import { describe, expect, test, vi } from "vitest";
import { createAudioSession, createMusicDuck, DUCKED_GAIN, FULL_GAIN, mapState, type AudioLike } from "./audio";

function fake(overrides: Partial<AudioLike> = {}): AudioLike & { resume: ReturnType<typeof vi.fn> } {
  const f = {
    state: "suspended",
    resume: vi.fn(async () => {
      f.state = "running";
    }),
    ...overrides,
  } as AudioLike & { resume: ReturnType<typeof vi.fn> };
  return f;
}

describe("mapState", () => {
  test("maps known states, unknown falls back to locked", () => {
    expect(mapState("running")).toBe("running");
    expect(mapState("suspended")).toBe("suspended");
    expect(mapState("interrupted")).toBe("interrupted");
    expect(mapState("closed")).toBe("closed");
    expect(mapState("")).toBe("locked");
    expect(mapState("bogus")).toBe("locked");
  });
});

describe("createAudioSession", () => {
  test("locked before unlock", () => {
    const session = createAudioSession(() => fake());
    expect(session.state()).toBe("locked");
    expect(session.handleStateChange()).toBe("locked");
  });

  test("unlock creates once and resumes to running", async () => {
    const ctx = fake();
    const factory = vi.fn(() => ctx);
    const session = createAudioSession(factory);
    await expect(session.unlock()).resolves.toBe("running");
    expect(factory).toHaveBeenCalledTimes(1);
    expect(ctx.resume).toHaveBeenCalledTimes(1);
    await session.unlock();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(session.state()).toBe("running");
    expect(session.handleStateChange()).toBe("running");
  });

  test("hidden visibility does nothing", async () => {
    const ctx = fake({ state: "suspended" });
    const session = createAudioSession(() => ctx);
    await session.unlock();
    ctx.state = "suspended";
    (ctx.resume as ReturnType<typeof vi.fn>).mockClear();
    await session.onVisibility(false);
    expect(ctx.resume).not.toHaveBeenCalled();
  });

  test("visible resumes when suspended and when interrupted", async () => {
    const suspended = fake({ state: "suspended" });
    const s1 = createAudioSession(() => suspended);
    await s1.unlock();
    suspended.state = "suspended";
    (suspended.resume as ReturnType<typeof vi.fn>).mockClear();
    await s1.onVisibility(true);
    expect(suspended.resume).toHaveBeenCalledTimes(1);

    const interrupted = fake({ state: "interrupted" });
    const s2 = createAudioSession(() => interrupted);
    await s2.unlock();
    interrupted.state = "interrupted";
    (interrupted.resume as ReturnType<typeof vi.fn>).mockClear();
    await s2.onVisibility(true);
    expect(interrupted.resume).toHaveBeenCalledTimes(1);
  });

  test("visible does not resume when running", async () => {
    const ctx = fake({ state: "running" });
    const session = createAudioSession(() => ctx);
    await session.unlock();
    (ctx.resume as ReturnType<typeof vi.fn>).mockClear();
    await session.onVisibility(true);
    expect(ctx.resume).not.toHaveBeenCalled();
  });

  test("cues logged in order, cues() returns a copy", () => {
    const session = createAudioSession(() => fake());
    session.logCue("say", 0);
    session.logCue("pop", 120);
    session.logCue("sparkle", 300);
    expect(session.cues()).toEqual([
      { name: "say", atMs: 0 },
      { name: "pop", atMs: 120 },
      { name: "sparkle", atMs: 300 },
    ]);
    const copy = session.cues();
    copy.push({ name: "mutated", atMs: 999 });
    expect(session.cues()).toHaveLength(3);
  });

  test("logCue without atMs uses injected now()", () => {
    const session = createAudioSession(() => fake(), () => 42);
    session.logCue("say");
    expect(session.cues()).toEqual([{ name: "say", atMs: 42 }]);
  });
});

describe("createMusicDuck", () => {
  test("starts full and applies nothing", () => {
    const apply = vi.fn();
    const duck = createMusicDuck(apply);
    expect(duck.state()).toBe("full");
    expect(duck.level()).toBe(FULL_GAIN);
    expect(apply).not.toHaveBeenCalled();
  });

  test("duck lowers the level, unduck restores it", () => {
    const apply = vi.fn();
    const duck = createMusicDuck(apply);
    duck.duck();
    expect(duck.state()).toBe("ducked");
    expect(duck.level()).toBe(DUCKED_GAIN);
    expect(apply).toHaveBeenLastCalledWith(DUCKED_GAIN);
    duck.unduck();
    expect(duck.state()).toBe("full");
    expect(duck.level()).toBe(FULL_GAIN);
    expect(apply).toHaveBeenLastCalledWith(FULL_GAIN);
  });

  test("repeated duck or unduck applies once", () => {
    const apply = vi.fn();
    const duck = createMusicDuck(apply);
    duck.duck();
    duck.duck();
    expect(apply).toHaveBeenCalledTimes(1);
    duck.unduck();
    duck.unduck();
    expect(apply).toHaveBeenCalledTimes(2);
  });
});
