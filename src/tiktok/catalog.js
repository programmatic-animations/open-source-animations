import { createTheBearScene, SCENE_CONFIG as theBear } from './theBear/scene.js';
import { createTheBearScene as createTheBearV4, SCENE_CONFIG as theBearV4 } from './theBear/sceneV4.js';
import { createTheBearScene as createTheBearV3, SCENE_CONFIG as theBearV3 } from './theBear/sceneV3.js';
import { createCapitolCrossingScene, SCENE_CONFIG as capitolCrossing } from './capitolCrossing/scene.js';
import { createAwkwardHelloScene, SCENE_CONFIG as awkwardHello } from './awkwardHello/scene.js';
import { createIntroScene, SCENE_CONFIG } from './intro/scene.js';
import { createIntroV2Scene, SCENE_CONFIG as introV2 } from './introV2/scene.js';
import { createBeYouScene, SCENE_CONFIG as beYou } from './beYou/scene.js';

// TikTok video → scenes → shots. Keep these separate from story episodes.
// Use globally unique, tiktok-prefixed video and scene IDs.
export const TIKTOK_VIDEOS = [
  { id: 'tiktok-intro', title: 'TikTok 1 — Meet Balu', scenes: [
    { ...SCENE_CONFIG, create: createIntroScene },
    { ...introV2, create: createIntroV2Scene }
  ] },
  { id: 'tiktok-awkward-hello', title: 'TikTok 2 — He only said hi', scenes: [
    { ...awkwardHello, create: createAwkwardHelloScene }
  ] },
  { id: 'tiktok-capitol-crossing', title: 'TikTok 3 — The coast is clear', scenes: [
    { ...capitolCrossing, create: createCapitolCrossingScene }
  ] },
  { id: 'tiktok-the-bear', title: 'TikTok 4 — The Bear', scenes: [
    { ...theBear, create: createTheBearScene },
    { ...theBearV4, create: createTheBearV4 },
    { ...theBearV3, create: createTheBearV3 }
  ] },
  { id: 'tiktok-be-you', title: 'TikTok 5 — Be You', scenes: [
    { ...beYou, create: createBeYouScene }
  ] }
];
