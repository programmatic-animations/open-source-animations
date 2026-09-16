import { defineShots } from '../runtime/shotTimeline.js';

// Every actual cut has a stable ID, duration, and camera direction.
export const HONEY_BETRAYAL_SHOTS = defineShots([
  { id: 'conspiracy', title: 'The conspiracy', duration: 4,
    update: ({ shot, mix, ease, t }) => shot([0, 2.55, 0.1], [0, 2.9, -3.1], mix(53, 47, ease(t, 0, 4))) },
  { id: 'their-price', title: 'Their price', duration: 1.8,
    update: ({ shot }) => shot([0, 2.2, 0.6], [0, 2.55, -3], 58) },
  { id: 'honey-insert', title: 'The price: honey', duration: 1.2,
    update: ({ shot }) => shot([1.2, -1.8, 2], [0.15, -3.05, 0.6], 39) },
  { id: 'agreement', title: 'A deal', duration: 3,
    update: ({ shot }) => shot([0.1, -1.85, 2.4], [-0.4, -1.92, 0.15], 42) },
  { id: 'pickup', title: 'The honey', duration: 3,
    update: ({ shot }) => shot([1.8, -1.5, 2], [-0.2, -2.5, 0.2], 53) },
  { id: 'ladder', title: 'A way out', duration: 4,
    update: ({ shot }) => shot([1.8, -0.4, 1.6], [0, -0.35, -2.5], 65) },
  { id: 'climb', title: 'The climb', duration: 6,
    update: ({ shot, mix, climb, b }) => shot([1.9, mix(-1.4, 1.4, climb), 0.1], [0, b.bear.position.y + 1.1, -2.35], 58) },
  { id: 'honey-first', title: 'Honey first', duration: 4,
    update: ({ shot }) => shot([1.4, 2.1, -0.2], [-0.35, 2.35, -2.7], 48) },
  { id: 'reluctant-choice', title: 'A reluctant choice', duration: 4,
    update: ({ shot, mix, ease, editorialTime }) => shot([-1.9, 1.85, -1.8], [-0.12, 1.35, -2.28], mix(51, 47, ease(editorialTime, 27, 31))) },
  { id: 'handover', title: 'The handover', duration: 3,
    update: ({ shot }) => shot([0.9, 1.9, -0.3], [-0.43, 1.95, -2.55], 38) },
  { id: 'betrayal', title: 'Betrayal', duration: 2,
    update: ({ shot }) => shot([0.3, 2.7, -0.1], [0, 2.4, -2.7], 47) },
  { id: 'fall', title: 'The fall', duration: 3,
    update: ({ shot, mix, fall, b, t, camera }) => {
      shot([1.8, mix(0.7, -1.2, fall), 1.8], [0, b.bear.position.y + 0.55, b.bear.position.z], 67);
      const shake = Math.max(0, 1 - Math.abs(t - 33.16) / 0.3) * 0.07;
      camera.position.x += Math.sin(t * 91) * shake; camera.position.y += Math.cos(t * 83) * shake;
    } },
  { id: 'silence', title: 'The silence', duration: 3,
    update: ({ shot }) => shot([1.6, -1.5, 1.9], [0, -2.1, -0.1], 56) },
  { id: 'never-again', title: 'Never again', duration: 5,
    update: ({ shot, mix, ease, t }) => shot([0, -1.91, mix(2.2, 1.65, ease(t, 38, 41.5))], [0, -1.92, -0.07], 38) }
]);
