// Width, opening, teeth, tongue. Rhubarb's A–H and resting X visemes.
export const SHAPES = {
  A: [0.85, 0.025, 0, 0], B: [1, 0.18, 1, 0], C: [1, 0.48, 1, 0],
  D: [0.9, 0.85, 1, 1], E: [0.64, 0.55, 0, 0], F: [0.42, 0.4, 0, 0],
  G: [0.88, 0.12, 1, 0], H: [0.95, 0.4, 1, 1], X: [0.8, 0.025, 0, 0]
};
export function poseAt(cues, time) {
  const i = cues.findIndex(c => time >= c.start && time < c.end);
  if (i < 0) return [...SHAPES.X];
  const cue = cues[i];
  const target = SHAPES[cue.value] || SHAPES.X;
  const previous = i > 0 && cues[i - 1].end >= cue.start - 0.001 ? SHAPES[cues[i - 1].value] || SHAPES.X : SHAPES.X;
  const t = Math.min(1, Math.max(0, (time - cue.start) / Math.min(0.065, (cue.end - cue.start) / 2)));
  const smooth = t * t * (3 - 2 * t);
  return target.map((v, n) => previous[n] + (v - previous[n]) * smooth);
}
