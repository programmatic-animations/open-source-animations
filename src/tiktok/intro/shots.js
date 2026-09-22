import { defineShots } from '../../runtime/shotTimeline.js';
import { DURATION, smooth } from './timing.js';

// Cancel the shared horizontal-coverage expansion for native portrait composition.
const verticalZoom = (16 / 9) / (9 / 16);
export const SHOTS = defineShots([
  { id: 'welcome', title: 'Welcome · full portrait', duration: 9.8, from: 5.25, to: 5.05, target: 1.19 },
  { id: 'conversation', title: 'Written in code', duration: 8.7, from: 4.65, to: 4.50, target: 1.28 },
  { id: 'closer', title: 'The upcoming hero', duration: 7.3, from: 4.45, to: 4.35, target: 1.32 },
  { id: 'sign-off', title: 'Sign-off · settle and hold', duration: DURATION - 25.8, from: 5.05, to: 5.18, target: 1.22 }
].map(shot => ({
  ...shot, verticalZoom,
  update({ camera, progress }) {
    const z = shot.from + (shot.to - shot.from) * smooth(progress);
    camera.fov = 40;
    camera.position.set(.035 * Math.sin(progress * Math.PI), shot.target + .055, z);
    camera.lookAt(0, shot.target, 0);
  }
})));
