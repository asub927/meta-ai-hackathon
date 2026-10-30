// U13 audio: deterministic cue-blip synthesis + onset detection for verify.
// PCM16 WAV, 48 kHz mono. Sample-exact placement at segmentStart+atMs.

export const SAMPLE_RATE = 48000;

// Blip voices: say = 740 Hz / 90 ms, pop = 420 Hz / 70 ms (U13 brief).
// sparkle is not in the brief's two voices; give it a distinct short blip.
const VOICE = {
  say: { freq: 740, ms: 90 },
  pop: { freq: 420, ms: 70 },
  sparkle: { freq: 880, ms: 60 },
};

const voiceFor = (kind) => VOICE[kind] ?? VOICE.pop;

/** Mix cue blips into a float buffer; returns Float32Array of totalMs. */
export function synthCuesFloat(cues, totalMs) {
  const n = Math.round((totalMs / 1000) * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (const cue of cues) {
    const { freq, ms } = voiceFor(cue.kind);
    const len = Math.round((ms / 1000) * SAMPLE_RATE);
    const start = Math.round((cue.atMs / 1000) * SAMPLE_RATE);
    for (let i = 0; i < len; i++) {
      const idx = start + i;
      if (idx < 0 || idx >= n) continue;
      const t = i / SAMPLE_RATE;
      const env = Math.exp((-4 * i) / len); // decay envelope
      out[idx] += 0.5 * Math.sin(2 * Math.PI * freq * t) * env;
    }
  }
  // Clamp (overlaps should not occur; this only guards).
  for (let i = 0; i < n; i++) out[i] = Math.max(-1, Math.min(1, out[i]));
  return out;
}

/** PCM16 WAV (44-byte header) Buffer from cues. */
export function synthCuesWav(cues, totalMs) {
  const pcm = synthCuesFloat(cues, totalMs);
  const data = Buffer.alloc(pcm.length * 2);
  for (let i = 0; i < pcm.length; i++) {
    data.writeInt16LE(Math.round(pcm[i] * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/** Energy-onset detector over mono float PCM. Returns onset times in ms.
 *  Used by --verify-cues on ffmpeg-decoded AAC: threshold on the short-time
 *  energy rise, one onset per blip (refractory 40 ms < blip spacing). */
export function detectOnsets(pcmFloat, sampleRate) {
  const hop = Math.floor(sampleRate * 0.004); // 4 ms hop (~192 samples)
  const win = Math.floor(sampleRate * 0.008); // 8 ms window
  const energy = [];
  for (let s = 0; s + win < pcmFloat.length; s += hop) {
    let e = 0;
    for (let i = 0; i < win; i += 2) {
      const v = pcmFloat[s + i];
      e += v * v;
    }
    energy.push(e / (win / 2));
  }
  let peak = 0;
  for (const e of energy) if (e > peak) peak = e;
  if (peak <= 0) return [];
  const thresh = peak * 0.08;
  const onsets = [];
  // A cue at t=0 has no rising edge (energy starts high); count it directly.
  if (energy[0] > thresh) onsets.push(0);
  let lastOnsetIdx = -Infinity;
  const refractory = Math.ceil(40 / ((hop / sampleRate) * 1000)); // 40 ms in frames
  for (let i = 1; i < energy.length; i++) {
    if (energy[i] > thresh && energy[i - 1] <= thresh && i - lastOnsetIdx > refractory) {
      // Refine: back up to the last near-silence frame for sample-exact onset.
      let j = i;
      while (j > 0 && energy[j] > peak * 0.005) j--;
      const onsetFrame = Math.min(i, j + 1);
      onsets.push((onsetFrame * hop / sampleRate) * 1000);
      lastOnsetIdx = i;
    }
  }
  return onsets;
}
