import { createAwkwardHelloScene, SCENE_CONFIG as awkwardHello } from './awkwardHello/scene.js';
import { createIntroScene, SCENE_CONFIG } from './intro/scene.js';
import { createIntroV2Scene, SCENE_CONFIG as introV2 } from './introV2/scene.js';

// TikTok video → scenes → shots. Keep these separate from story episodes.
// Use globally unique, tiktok-prefixed video and scene IDs.
export const TIKTOK_VIDEOS = [
  { id: 'tiktok-intro', title: 'TikTok 1 — Meet Balu', scenes: [
    { ...SCENE_CONFIG, create: createIntroScene },
    { ...introV2, create: createIntroV2Scene }
  ] },
  { id: 'tiktok-awkward-hello', title: 'TikTok 2 — He only said hi', scenes: [
    { ...awkwardHello, create: createAwkwardHelloScene }
  ] }
];
