import speech from './speechTiming.js';
export const LEAD_IN = 2;
export const DIALOGUE_DURATION = speech.duration;
export const DURATION = LEAD_IN + DIALOGUE_DURATION + 2;
export const phrases = speech.phrases;
export const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

export function speechEnergy(time) {
  const audioTime = time - LEAD_IN;
  if (audioTime < 0 || audioTime >= DIALOGUE_DURATION) return 0;
  // Symmetric smoothing makes gestures follow emphasis without audio-rate jitter.
  let energy = 0, weight = 0;
  for (let offset = -6; offset <= 6; offset++) {
    const i = Math.round(audioTime / speech.step) + offset;
    const w = 7 - Math.abs(offset);
    energy += (speech.energy[i] ?? 0) * w;
    weight += w;
  }
  return energy / weight;
}

export function phraseActing(time) {
  const t = time - LEAD_IN;
  let left = 0, right = 0, nod = 0, lean = 0;
  phrases.forEach(([start, end], index) => {
    const strength = smooth((t - start + .12) / .38) * (1 - smooth((t - end) / .46));
    // Alternate one-paw and open two-paw deliveries; settle during pauses.
    left += strength * (index % 3 === 1 ? .15 : .46);
    right += strength * (index % 3 === 0 ? .16 : .46);
    nod += strength * Math.sin(Math.max(0, t - start) * 4.8) * .022;
    lean += strength * (index % 2 ? -.012 : .012);
  });
  return { left, right, nod, lean };
}

// Transcript times are approximate; the recorded energy still supplies the pulse.
function beat(t, start, end, fade = .3) {
  return smooth((t - start) / fade) * (1 - smooth((t - end) / fade));
}
export function dialogueActing(time) {
  const t = time - LEAD_IN;
  const greeting = beat(t, .55, 2.2);
  const attention = beat(t, 1.5, 3);
  const introduction = beat(t, 3.1, 6.9);
  const explaining = beat(t, 7.3, 14.5);
  const question = beat(t, 9.15, 10.8) + beat(t, 14.4, 15.5) + beat(t, 26.4, 27.8);
  const hero = beat(t, 17.4, 21.5);
  const invitation = beat(t, 22, 25.9);
  const farewell = beat(t, 29.7, 31.0);
  const okay = beat(t, 28, 29.7, .18);
  return {
    greeting, attention, introduction, explaining, question, hero, invitation, farewell,
    nod: okay * Math.sin((t - 28) * 8) * .035,
    wave: (greeting + farewell) * (.5 + .5 * Math.sin(t * 8))
  };
}
