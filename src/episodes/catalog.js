import { defineShots } from '../runtime/shotTimeline.js';
import { createBearHoneyTrapScene } from '../scenes/bearHoneyTrap.js';
import { createPitRabbitsScene } from '../scenes/pitRabbits.js';
import { createHoneyBetrayalScene, SCENE_CONFIG as betrayal } from '../scenes/honeyBetrayal.js';
import { createBearEp1Thumbnail, SCENE_CONFIG as thumbnail1 } from '../scenes/bearEp1Thumbnail.js';
import { createBearEp2Thumbnail, SCENE_CONFIG as thumbnail2 } from '../scenes/bearEp2Thumbnail.js';

// An episode owns ordered scenes; each scene owns shots and its world factory.
// Episode 1's original cameras are uninterrupted takes. Durations match existing exports.
export const EPISODES = [
  { id: 'ep1', title: 'Episode 1 — Honey Trap', thumbnail: { ...thumbnail1, create: createBearEp1Thumbnail }, scenes: [
    { id: 'bear-honey-trap', title: 'The honey trap', duration: 26.31, seekable: false,
      shots: defineShots([{ id: 'forest-master', title: 'Scent, climb, and fall', duration: 26.31 }]), create: createBearHoneyTrapScene },
    { id: 'pit-rabbits', title: 'The laughing rabbits', duration: 13.07, seekable: false,
      shots: defineShots([{ id: 'pit-master', title: 'Recovery and ridicule', duration: 13.07 }]), create: createPitRabbitsScene }
  ] },
  { id: 'ep2', title: 'Episode 2 — The Honey Deal', thumbnail: { ...thumbnail2, create: createBearEp2Thumbnail }, scenes: [
    { ...betrayal, seekable: true, create: createHoneyBetrayalScene }
  ] }
];

export function resolveSelection(params) {
  const episode = EPISODES.find(e => e.id === params.get('episode')) ?? EPISODES.at(-1);
  const thumbnail = params.get('scene') === 'thumbnail';
  const scene = thumbnail ? episode.thumbnail : episode.scenes.find(s => s.id === params.get('scene')) ?? episode.scenes[0];
  return { episode, scene, thumbnail };
}
