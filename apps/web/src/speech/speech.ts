/** Read-aloud hardening (U12a). Pure voice picking; speech calls stay in main.tsx.
 *  Follow-up: word highlighting during read-aloud (not attempted here). */

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
