# Bear Animation

Three.js cinematic scenes with a reusable character/prop runtime and 1080p MP4 export.

## Episode 3: DEA*H to the RABBITS — version 1

The default episode is now Episode 3: a 47-second horror continuation in 13 shots. Open `/?episode=ep3&t=0` to review from the beginning, or use the shot selector. The opening holds Episode 2's exact final pose and camera for two seconds. The bear discovers his fingers, lifts and spins the fallen branch, ignites his eyes, and gets a skeptical reaction from all four rabbits. He attacks the honey-holding rabbit, points at the survivors, and watches them panic and scatter before his slow grin and restrained laugh. This first pass uses whole-head separation, blood particles, and a falling body retaining the honey. It is silent; no soundtrack is included.

`src/scenes/deathToRabbits.js` composes the previous scene's frozen final world without changing its choreography. `src/shots/deathToRabbitsShots.js` owns the cuts and explicit choreography cues; `src/characters/horrorHands.js` adds optional fingers, and `src/environment/horrorForest.js` builds bare trees from geometry. Rabbit brows and running feet are optional additions in `src/characters/rabbitActing.js`. All poses and effects support reversible seeking. Update cue times alongside shot durations when editing. Episode 3 has a procedural horror thumbnail: a looming dark bear with fiery eyes above three tiny rabbits. Open `/?episode=ep3&scene=thumbnail`; Save thumbnail PNG writes `exports/thumbnail/bear-ep3-thumbnail.png` at 1920×1080.

Landscape export writes `exports/death-to-rabbits.mp4`; Episode 1 and 2 remain available in the episode selector.

## Episode 2: Betrayal

Episode 2's scene is `src/scenes/honeyBetrayal.js`: a 47-second continuation after the rabbits laugh. It covers their bargain, honey pickup, ladder deployment, climb, handover, betrayal, fall, and an angry close-up. `SHOTS` lists the editorial beats; every pose derives from absolute time.

Use Play/Pause and the timeline to review. `?episode=ep2&t=27` opens the reluctant-reaction shot; `?episode=ep2&scene=thumbnail` opens the programmatic Episode 2 thumbnail; `?episode=ep1&scene=thumbnail` preserves the original. The bear looks up at the rabbit, glances at the offered paw, hesitates, then extends the comb. The continuation stops at 47 seconds and supplies that default export end time. Set End can override it. `npm run dev` starts both the preview and export server. The export button checks the server before recording. Both localhost and 127.0.0.1 preview origins are supported.

Validation: `node --test tests/honeyBetrayal.test.js` checks finite transforms, reversible scrubbing, and the story's final object positions.

## Video formats — YouTube and TikTok

Use **Video format** in the animation preview to choose **Landscape · 1920 × 1080 (16:9)** or **TikTok · 1080 × 1920 (9:16)**. Landscape is the default. The preview fits the selected aspect ratio inside the window without stretching; MP4 and scene PNG exports use the exact selected resolution. Switching format preserves playback position and does not restart legacy scenes.

The selection is stored in the URL (`?episode=ep2&format=vertical`) and follows scene/episode navigation and export reloads. Landscape videos retain `exports/<scene-id>.mp4`; vertical videos use `exports/<scene-id>-vertical.mp4` so they do not overwrite landscape exports. Scene PNG downloads follow the same naming convention.

Vertical framing preserves the landscape horizontal field of view and reveals additional space above/below. It does not change acting, timing, or camera movement. This conservative framing may make subjects smaller; authors can tune individual shots using `verticalZoom` (see the authoring guide). Review each shot in vertical before publishing.

Thumbnail mode stays 1920×1080 and has no video format picker. Mouth Studio is unchanged.

## Authoring structure

See [Episode → scene → shot](docs/AUTHORING.md). The preview includes episode, scene, and shot selectors. `src/episodes/catalog.js` owns the hierarchy; `src/shots/` owns camera cuts.

## Commands

```bash
npm run dev
```

App: `http://localhost:5173`

```bash
node export-server.mjs
```

Export server: `http://127.0.0.1:5174` (started automatically by `npm run dev`; the standalone command is only needed when running Vite separately).

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

`src/scenes/bearHoneyTrap.js` contains the original opening; `src/main.js` defaults to the latest episode in the catalog.

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
4. Register the scene under its episode in `src/episodes/catalog.js`; the existing selectors expose it.
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
4. Canvas is recorded at the selected resolution (1920×1080 or 1080×1920), pixel ratio 1, matching camera aspect, `captureStream(60)`, VP9 WebM when supported, 16 Mbps.
5. Recording stops at the saved scene end time.
6. WebM is POSTed to `http://localhost:5174/export` with `X-Scene-Id`.
7. FFmpeg writes `exports/<scene-id>.mp4` (or `<scene-id>-vertical.mp4`) (`libx264`, CRF 18, `yuv420p`, `+faststart`, no audio).

Keep `node export-server.mjs` running during export.

## APIs for a future agent

- Scene: `createBearHoneyTrapScene`, `SCENE_CONFIG`
- Runtime: `createSceneRuntime({ renderer, scene, camera, update, afterRender })` → `start`, `getCurrentTime`, `pause`, `restartFromZero`
- End time: `getSceneEndTime(sceneId)`, `setSceneEndTime(sceneId, time)`, `clearSceneEndTime(sceneId)`, `setupSceneEndButton(...)`
- Export: `isExportMode()`, `setupExportButton({ sceneEndTime })`, `createVideoExporter({ renderer, camera, sceneConfig, getSceneEndTime, restartScene, pauseScene })`

## Mouth Studio — standalone speech overlay

Mouth Studio turns a voice recording into a programmatic Three.js talking-mouth overlay. Rhubarb recognizes speech sounds and produces timed mouth shapes; the studio blends those shapes and renders transparent frames. Place, resize, and time the result over your character in a video editor. It does not change the episode animation or attach a mouth to the character automatically.

### Open it

From the project directory:

```bash
npm install             # first setup only
npm run setup:speech     # first setup only: downloads Rhubarb 1.14.0
npm run dev
```

Open [Mouth Studio](http://127.0.0.1:5173/mouth.html), or click **Mouth Studio** in the animation preview. Keep the terminal running. Both the preview (5173) and local export server (5174) are needed. Python 3 is required for ZIP export; macOS/Linux setup also uses `unzip`. An existing Rhubarb executable can be supplied through `RHUBARB_PATH`. See [the complete guide](docs/MOUTH_STUDIO.md) for usage, Resolve import, troubleshooting, and architecture.

### Use it

1. Choose a recording (up to 30 MB / 120 seconds).
2. Select English or the phonetic recognizer for other languages; click **Create lip sync**.
3. Play, pause, or scrub to review.
4. Choose **PNG sequence + WAV**, the default Resolve workflow, and optionally include voice.
5. Click **Export transparent overlay** and extract the downloaded ZIP.

In Resolve's Media Storage menu, disable **Show Individual Frames** and import the numbered PNGs as one sequence. Set Clip Attributes to **30 fps** and **Straight** alpha, place the sequence above your animation, and align `voice.wav` with its first frame.

ProRes 4444 MOV remains available, but the user reported an opaque black background in Resolve even with Straight alpha. FFmpeg can read its alpha; that alone does not establish Resolve compatibility. Use PNG sequence + WAV for this workflow.

Exports are 512×512 at 30 fps, downloaded in the browser and copied to `exports/`. Processing stays local. The checkerboard is preview-only. See the guide for session lifetime and storage details.

Validation: `node --test tests/*.test.js` and `npm run build`.

## TikTok collection

Choose **Collection → TikTok videos**, or open
[the TikTok workspace](http://127.0.0.1:5173/?collection=tiktok).
It has its own video catalog and is locked to **1080×1920 portrait**.
MP4s save under `exports/tiktok/`; episodes retain their existing output paths
and format options. The first video, **Meet Balu**, is a silent portrait intro with two-second idle handles.
Place the original dialogue at **00:02.000** in post-production.
See [authoring](docs/AUTHORING.md#tiktok-workflow) to add videos.
The intro's body and eye acting follow the recording and transcript; mouth overlays
and dialogue audio are added in post-production. See [intro notes](src/tiktok/intro/README.md).

The intro also has a dynamic **V2 — Balu · made of code** in its scene selector:
motion/text hook, code reveal, hero cape, expressive reactions and quicker cuts.
It exports separately as `exports/tiktok/tiktok-intro-v2-vertical.mp4`.
Both versions use the same audio placement at **00:02.000**.

## TikTok 2 — He only said hi

Open `/?collection=tiktok&video=tiktok-awkward-hello&t=0`. Balu and a new reusable
monkey keep walking during an awkward greeting, followed by Balu's deadpan trip
to the cemetery. The revised cut has nine portrait shots (20.85 seconds), a physical grave and an
overhead pullback. It is silent; add dialogue and mouths in post. See
[shot and dialogue notes](src/tiktok/awkwardHello/README.md). Export writes
`exports/tiktok/tiktok-awkward-hello-main-vertical.mp4`.
