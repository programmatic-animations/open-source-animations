import { defineShots } from '../runtime/shotTimeline.js';

export const DEATH_TO_RABBITS_SHOTS = defineShots([
  { id: 'anger', title: 'The anger remains', duration: 2,
    update: ({ frame }) => frame([0, -1.91, 1.65], [0, -1.92, -0.07], 38) },
  { id: 'something-inside', title: 'Something inside his hands', duration: 2.5,
    update: ({ frame }) => frame([0.75, -1.5, 2], [0, -2.1, 0.1], 43) },
  { id: 'fingers', title: 'The hands awaken', duration: 5.5,
    update: ({ frame, progress }) => frame([0, -1.8, 1.65 - progress * 0.18], [0, -2.28, 0.48], 43) },
  { id: 'weapon', title: 'The broken branch', duration: 4,
    update: ({ frame }) => frame([2.15, -1.4, 2], [0.45, -2.5, -0.15], 56) },
  { id: 'fire', title: 'Eyes on fire', duration: 3,
    update: ({ frame }) => frame([-0.85, -1.25, -2.05], [0, -1.95, -0.2], 41) },
  { id: 'skeptical', title: 'What is he going to do?', duration: 2,
    update: ({ frame }) => frame([0, 3.15, 0.4], [0, 3.15, -3.12], 50) },
  { id: 'spear', title: 'The throw', duration: 3,
    update: ({ frame }) => frame([2.4, -1.25, 0.5], [-0.1, -1.9, -0.25], 57) },
  { id: 'impact', title: 'The price of the honey', duration: 1.2,
    update: ({ frame, t }) => frame([-1.8, 2.8, -0.6], [-0.68, 2.8 + Math.max(0, t - 20.25) * 0.45, -3.2], 53) },
  { id: 'fall', title: 'Still holding the honey', duration: 3.8,
    update: ({ frame, corpse }) => frame([1.8, -0.25, 1.35], [corpse.x, Math.max(-2.8, corpse.y + 0.4), corpse.z], 64) },
  { id: 'horror', title: 'The remaining rabbits', duration: 3.5,
    update: ({ frame, progress }) => frame([0.35, 2.95, 0.6 - progress * 0.25], [0.1, 3.02, -3.1], 63) },
  { id: 'you-next', title: 'You are next', duration: 3.5,
    update: ({ frame }) => frame([-1.1, -0.8, -2.2], [0, -1.9, -0.2], 48) },
  { id: 'scatter', title: 'Run!', duration: 5,
    update: ({ frame, shotTime }) => {
      const p = Math.max(0, Math.min(1, (shotTime - 1.25) / 2.8));
      const pull = p * p * (3 - 2 * p);
      frame([0.1, 3.15 + 1.35 * pull, 0.4 + 1.6 * pull], [0.1, 3.15 - 0.55 * pull, -3.15 - 10 * pull], 50 - 8 * pull);
    } },
  { id: 'smile', title: 'An evil smile and laugh', duration: 8,
    update: ({ frame, shotTime }) => frame([0, -1.8, -2.15 + Math.min(shotTime / 5, 1) * 0.2], [0, -1.98, -0.18], 39) }
]);
export const HORROR_CUES = Object.freeze({ fingers: 7.15, grip: 12.05, release: 19.65, impact: 20.25, fall: 21.2, land: 23.6, smile: 34, laugh: 36.6 });

// Insert reaction time without retiming the approved choreography beneath the cuts.
export function horrorStoryTime(editorialTime) {
  if (editorialTime < 17) return editorialTime;
  if (editorialTime < 19) return 17;
  if (editorialTime < 34) return editorialTime - 2;
  if (editorialTime < 39) return 32;
  return editorialTime - 7;
}
