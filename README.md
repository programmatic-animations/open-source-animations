# Bear Animation

Three.js cinematic scenes with a reusable character/prop runtime and 1080p MP4 export.

## Commands

```bash
npm run dev
```

App: `http://localhost:5173`

```bash
node export-server.mjs
```

Export server: `http://localhost:5174`

## Module structure

```text
src/
  main.js                      Bootstrap: renderer, camera, runtime, Set End, export
  scenes/bearHoneyTrap.js      Scene 1 story, lighting, and timeline
  characters/bear.js           Bear factory (shoulder-pivot arms)
  props/tree.js                Tree, trunk, branch pivot, honeycomb attachment
  props/honeycomb.js           Honeycomb cells
  props/pit.js                 Hidden pit and leaf cover
  props/bees.js                Bee meshes and trunk-avoidance helpers
  props/scentTrail.js          Honey-scent particles
  environment/ground.js        Ground plane
  environment/backdrop.js      Forest backdrop + sRGB color space
  animation/animationUtils.js  lerpProgress / clampProgress
  runtime/sceneRuntime.js      Clock, pause, elapsed time, render loop
  runtime/sceneEnd.js          Namespaced localStorage scene-end times + Set End UI
  export/recorder.js           Browser MediaRecorder + POST to export server
export-server.mjs              WebM → H.264 MP4 via ffmpeg-static
```

## What each reusable module owns

| Module | Owns |
| --- | --- |
| `createBear` | Bear hierarchy, including `leftArm` / `rightArm` **shoulder pivot groups** |
| `createTree` | Trunk, canopy, `branchPivot`, branch, honeycomb parenting |
| `createHoneycomb` | Hex cell cluster |
| `createPit` | Pit hole, leaf cover, per-leaf collapse start data |
| `createBees` / `createBee` | Bee meshes parented to a honeycomb; `keepBeeOutsideTrunk` |
| `createScentTrail` | Path particles |
| `createGround` / `createBackdrop` | Environment meshes |
| `createSceneRuntime` | `THREE.Clock`, `currentSceneTime`, pause, `renderer.render` |
| `getSceneEndTime` / `setSceneEndTime` / `clearSceneEndTime` | `localStorage` key `scene-end:<sceneId>` |
| `createVideoExporter` | `?export=1`, 1920×1080, `captureStream(60)`, MediaRecorder, POST `/export` |

## Scene 1 entry point

`src/main.js` loads `createBearHoneyTrapScene` from `src/scenes/bearHoneyTrap.js`.

`SCENE_CONFIG`:

```js
{
  id: 'bear-honey-trap',
  title: 'Bear Honey Trap'
}
```

## Creating a future scene

1. Add `src/scenes/yourScene.js` with its own `SCENE_CONFIG` (`id`, `title`) and `createYourScene({ scene, camera, renderer })` returning `{ config, update }`.
2. Compose reused factories (`createBear`, `createTree`, …) instead of copying meshes.
3. Keep story timing, `attach()` reparenting, and cinematic phases in the scene module.
4. Point `src/main.js` at the new scene (or add a scene picker later).
5. Reuse `createSceneRuntime`, scene-end helpers, and `createVideoExporter` unchanged. They key storage and MP4 names off `sceneConfig.id`.

## Reusing characters and props

```js
const { bear, headGroup, leftArm, rightArm, leftLeg, rightLeg, nose } =
  createBear({ position: { x: -3, y: 0, z: 0 } });

const honeycomb = createHoneycomb();
const { tree, trunk, branchPivot, branch } = createTree({ honeycomb });
const bees = createBees({ honeycomb });
```

Preserve world transforms with `attach()`, not `add()`, when reparenting (bear onto branch, branch onto scene, bees off honeycomb).

## Set End

1. Play the scene.
2. Click **Set End**.
3. Current elapsed time is written to `localStorage` as `scene-end:<sceneId>`.
4. The scene pauses.
5. After reload, **Export 1080p MP4** is enabled if an end time exists.

Export stays disabled until an end time is present at page load (same as before).

## Export

1. Set End, then **Export 1080p MP4**.
2. Page reloads with `?export=1`.
3. Scene restarts at time 0.
4. Canvas is recorded at 1920×1080, pixel ratio 1, 16:9 camera, `captureStream(60)`, VP9 WebM when supported, 16 Mbps.
5. Recording stops at the saved scene end time.
6. WebM is POSTed to `http://localhost:5174/export` with `X-Scene-Id`.
7. FFmpeg writes `exports/<scene-id>.mp4` (`libx264`, CRF 18, `yuv420p`, `+faststart`, no audio).

Keep `node export-server.mjs` running during export.

## APIs for a future agent

- Scene: `createBearHoneyTrapScene`, `SCENE_CONFIG`
- Runtime: `createSceneRuntime({ renderer, scene, camera, update, afterRender })` → `start`, `getCurrentTime`, `pause`, `restartFromZero`
- End time: `getSceneEndTime(sceneId)`, `setSceneEndTime(sceneId, time)`, `clearSceneEndTime(sceneId)`, `setupSceneEndButton(...)`
- Export: `isExportMode()`, `setupExportButton({ sceneEndTime })`, `createVideoExporter({ renderer, camera, sceneConfig, getSceneEndTime, restartScene, pauseScene })`
