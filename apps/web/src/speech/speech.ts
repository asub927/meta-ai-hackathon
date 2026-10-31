/** Read-aloud hardening (U12a). Pure voice picking; speech calls stay in main.tsx. */

export interface VoiceLike {
  name: string;
  localService: boolean;
  lang: string;
}

/** First on-device voice whose language starts with "en", else null.
 *  Never returns a remote voice: child speech stays on the device. */
export function pickLocalVoice<T extends VoiceLike>(voices: readonly T[]): T | null {
  return voices.find((v) => v.localService && v.lang.startsWith("en")) ?? null;
}

/** Speak only when the toggle is on and an on-device voice exists. */
export function shouldSpeak(enabled: boolean, hasLocal: boolean): boolean {
  return enabled && hasLocal;
}

export interface SpokenLine {
  text: string;
  voiceName: string;
  atMs: number;
}

export interface VoiceLog {
  record(text: string, voiceName: string): void;
  lines(): SpokenLine[];
}

export function createVoiceLog(now: () => number = Date.now): VoiceLog {
  const spoken: SpokenLine[] = [];
  return {
    record(text, voiceName) {
      spoken.push({ text, voiceName, atMs: now() });
    },
    lines() {
      return [...spoken];
    },
  };
}

export interface BoundaryEventLike {
  charIndex: number;
  charLength?: number;
}

export interface UtteranceLike {
  onboundary: ((event: BoundaryEventLike) => void) | null;
}

export interface BoundaryWord {
  word: string;
  charIndex: number;
  charLength: number;
}

export function boundaryWord(text: string, charIndex: number): BoundaryWord | null {
  if (charIndex < 0 || charIndex >= text.length) return null;
  if (/\s/.test(text[charIndex]!)) return null;
  let start = charIndex;
  while (start > 0 && !/\s/.test(text[start - 1]!)) start--;
  let end = charIndex;
  while (end < text.length && !/\s/.test(text[end]!)) end++;
  return { word: text.slice(start, end), charIndex: start, charLength: end - start };
}

export function trackBoundaries(
  utterance: UtteranceLike,
  text: string,
  onWord: (word: BoundaryWord) => void,
): void {
  utterance.onboundary = (event) => {
    const found = boundaryWord(text, event.charIndex);
    if (found) onWord(event.charLength === undefined ? found : { ...found, charLength: event.charLength });
  };
}
