import { defineShots } from '../../runtime/shotTimeline.js';
import { DURATION, smooth } from '../intro/timing.js';

export const SHOTS = defineShots([
  ['lead-in', 'Idle handle', 2, 5.25, 5.25, 1.32, 0],
  ['hook', 'Hello?! · snap out', 1.3, 3.9, 5.2, 1.49, 0],
  ['attention', 'Are you listening? · punch in', 1.7, 4.05, 3.98, 1.55, -.12],
  ['name', 'Meet Balu · name reveal', 2.8, 5.35, 5.1, 1.25, .12],
  ['identity', 'An Indian bear', 1.45, 4.8, 4.7, 1.38, -.1],
  ['build', 'Made of code · reveal', 1.9, 5.6, 5.35, 1.25, .12],
  ['question', 'You know what that means?', 1.85, 4.1, 4.02, 1.58, -.13],
  ['proof', 'Show the code', 3.4, 5.5, 5.3, 1.24, .16],
  ['understand', 'You are getting? · eyebrow', 2.4, 4.12, 4.05, 1.57, -.12],
  ['hero', 'Hero reveal · cape and stance', 4.7, 5.55, 5.0, 1.25, .16],
  ['watch', 'Watch the series', 2.4, 4.65, 4.52, 1.42, -.1],
  ['follow', 'Follow Balu · point down', 2.3, 5.25, 5.05, 1.27, .08],
  ['check', 'Understanding? · side-eye', 1.8, 4.1, 4.03, 1.58, -.13],
  ['okay-one', 'Okay · nod one', 1, 4.65, 4.65, 1.44, 0],
  ['okay-two', 'Okay · closer', .7, 4.25, 4.25, 1.52, 0],
  ['bye', 'Bye · wave and settle', 1.957333, 5.15, 5.25, 1.32, 0],
  ['tail', 'Idle handle', 2, 5.25, 5.25, 1.32, 0]
].map(([id, title, duration, from, to, target, offset]) => ({
  id, title, duration, verticalZoom: (16 / 9) / (9 / 16),
  update({ camera, progress, shotTime }) {
    const move = smooth(id === 'hook' ? shotTime / .6 : progress);
    camera.fov = 40;
    camera.position.set(offset * Math.sin(Math.PI * progress), target + .04, from + (to - from) * move);
    camera.lookAt(0, target, 0);
  }
})));
if (Math.abs(SHOTS.at(-1).end - DURATION) > .00001) throw new Error('V2 shots must match the audio and handles');
