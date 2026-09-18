# Working agreement

- **Optimize tokens without compromising quality.** Keep updates and answers concise; inspect only relevant files, batch independent reads, and avoid repeating context or checks without cause.
- All animation and thumbnails must be **programmatically created** using our Three.js characters, geometry, lighting, cameras, and canvas typography. Do not use AI image generation for deliverables.
- Favor expressive acting and cinematic cuts that make the story clear. Preserve approved animation unless the request changes it.
- Organize work as **episode → scenes → shots**. Reuse character/prop factories. See `docs/AUTHORING.md` when changing the structure or timing.
- Check `git status` before editing; preserve existing changes. Do not assume prior commit/push status from conversation history.

# Quick context

This is a Vite + Three.js animation project, with browser preview, scene/shot selectors, PNG thumbnails, and MP4 export through a local FFmpeg server.

# Creative concept and current conversation

We are building an episodic animated YouTube series **through code**. Reusable bear and rabbit models perform visually told stories with expressive acting, props, camera movement, and cinematic cuts. Characters, staging, timing, and thumbnails are authored programmatically in Three.js rather than generated as finished AI images or videos. Reusable assets and the episode → scene → shot structure make it possible to develop more stories consistently.

The current story uses honey, deception, slapstick, and an emotional cliffhanger: rabbits exploit a bear's trust, and his humiliation turns to anger. These are the creative ingredients to understand when discussing audience appeal, positioning, titles, thumbnails, promotion, or future story ideas. The code-based production method is a defining constraint; whether to feature that method in audience-facing marketing is a discussion, not a settled strategy.

**Current feature:** Standalone Mouth Studio is implemented. Users upload recorded speech, preview Rhubarb-driven Three.js mouth shapes, and export a transparent overlay for placement in a video editor. Keep this separate from episode animation unless requested. See `docs/MOUTH_STUDIO.md` for setup, use, limitations, and architecture.

**Thumbnail status:** The user has already uploaded the new “BETRAYAL” thumbnail to YouTube and is A/B testing it against the old “BIG MISTAKE!” thumbnail. The test is underway; results have not been supplied. Do not suggest uploading or starting that same test again, and do not claim a winner.

**Episode 1 — Honey Trap:** A bear smells honey, climbs a tree, breaks the branch, and falls into a hidden pit. Rabbits look over the edge and laugh.

**Episode 2 — Betrayal:** Rabbits request the honey. The bear agrees and picks it up; they lower a rope ladder. Before he reaches the top, they demand the comb. He looks at the rabbit, then its offered paw, hesitates, and hands it over. They release the ladder; he falls with it. He recovers, and the episode ends on his fiercely angry face.

Episode 2's approved animation is 47 seconds with 14 shots. The reluctant close-up starts at 27 seconds. Its internal scene ID is still `honey-betrayal` and scene title is `The Honey Deal`; the **episode's public name is Betrayal**.

# Where to work

- `src/episodes/catalog.js`: episodes, scene registration, thumbnail factories.
- `src/scenes/honeyBetrayal.js`: Episode 2 world and character/prop choreography.
- `src/shots/honeyBetrayalShots.js`: ordered shot durations and camera directions.
- `src/runtime/shotTimeline.js`: shot selection and local time.
- `src/characters/`, `src/props/`, `src/environment/`: shared assets.
- `src/scenes/bearEp2Thumbnail.js`: current programmatic thumbnail.
- `src/main.js`: preview selectors, playback, export wiring.
- `src/export/`, `export-server.mjs`: PNG/MP4 output.

# Latest handoff (2026-09-18)

- User reported poor performance from the original “BIG MISTAKE!” thumbnail. No analytics were supplied; performance causes are hypotheses.
- Latest replacement: “BETRAYAL,” shocked bear, one rabbit holding honey and releasing the ladder. Built from code, not a generated image.
- The user has already put this variant into a YouTube A/B test against the previous thumbnail. No A/B test results have been supplied.
- Latest PNG: `exports/thumbnail/bear-ep2-betrayal.png`; active export also writes `bear-ep2-thumbnail.png`. Prior image preserved as `bear-ep2-big-mistake.png` in that directory.
- Approved movie: `exports/honey-betrayal.mp4`. Thumbnail-only changes do not require re-exporting it.
- Mouth Studio and earlier thumbnail changes are being committed together at the user’s request. Always inspect fresh git state instead of assuming commit or remote status.
- Latest thumbnail build passed and its PNG was visually inspected. Before that, six animation/timeline tests passed and 189 sampled frames confirmed the hierarchy refactor preserved poses and cameras.

# Mouth Studio handoff

- Open `/mouth.html` from the running preview, or use its Mouth Studio link.
- First setup: `npm install`, `npm run setup:speech`; Python 3 is needed for PNG ZIPs. `npm run dev` starts both required servers.
- `src/speech/mouth.js`: Three.js geometry; `cues.js`: absolute-time viseme blending; `studio.js` / `studio.css`: upload, preview, export UI.
- `scripts/speech-server.mjs`: local audio analysis, sequential frame uploads, ZIP/MOV export; `scripts/install-rhubarb.mjs`: pinned official Rhubarb installer.
- Default export: transparent PNG sequence + optional WAV. Import sequence at 30 fps in Resolve. ProRes MOV is available but showed opaque black in the user's Resolve despite Straight alpha; do not claim it is fixed based on FFmpeg checks.
- Browser upload-through-download tests passed for both formats; PNG alpha and ZIP contents verified. Eight automated tests pass. Exact Resolve interoperability still requires user confirmation.
- Existing recordings/exports remain in `exports/`; temporary analysis lives in ignored `.export-temp/`, installed binaries in ignored `.tools/`. No AI image generation.

# Run and verify

- `npm run dev`: preview at `http://127.0.0.1:5173`, export server at port 5174.
- Thumbnail: `/?episode=ep2&scene=thumbnail`; “Save thumbnail PNG” writes a 1920×1080 PNG into `exports/thumbnail/`.
- Reaction: `/?episode=ep2&scene=honey-betrayal&t=27` (paused).
- `node --test tests/*.test.js`; `npm run build`.
- Episode 2 supports reversible seeking. Episode 1's legacy scenes are stateful, so seeking is disabled. Export operates on one scene, not a concatenated episode.
- Shot duration changes also require updating choreography cues; automatic retiming is not implemented.

Use this file as the initial handoff, then follow the user's latest request. Do not reread the whole repository to start a conversation. For marketing discussions, prioritize the creative concept and current conversation section over implementation details.
