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

# Video format handoff

- Animation preview now has Landscape 1920×1080 and TikTok 1080×1920 format selection. `src/runtime/videoFormat.js` owns presets/framing/names.
- URL `format=vertical` persists through navigation and export. Live switching preserves playback; preview fits the chosen aspect ratio.
- MP4 and scene PNG use selected dimensions. Vertical files add `-vertical`; landscape names stay unchanged.
- Vertical projection preserves horizontal coverage and shows more above/below. Optional shot `verticalZoom` tightens framing; review shots before cropping. Approved choreography and landscape cameras are unchanged.
- Thumbnail output stays landscape; Mouth Studio stays independent. See README and `docs/AUTHORING.md`.

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

# Episode 3 — version 1 (2026-09-18)

- Public title: **DEA*H to the RABBITS**; scene ID `death-to-rabbits`, episode `ep3`. Latest/default episode, 47 seconds, 13 shots; first pass awaiting user revisions.
- Opens with Episode 2's exact final camera and pose for two seconds. Then: hand tension and finger emergence, branch pickup, fiery eyes, spear throw, whole-head separation, bloody fall retaining honey in both paws, horrified survivors, pointing threat, two-second face hold then sharp-toothed grin and a three-second laughing hold (subtle jaw, head, and shoulder pulses).
- `src/scenes/deathToRabbits.js` freezes the existing Episode 2 final world and adds reversible choreography. Episode 2 only exposes actor references; approved poses are unchanged.
- Shots and choreography cues: `src/shots/deathToRabbitsShots.js`. Optional fingers: `src/characters/horrorHands.js`. Procedural bare trees: `src/environment/horrorForest.js`.
- Preview: `/?episode=ep3&t=0`. Export: `exports/death-to-rabbits.mp4`. Silent first cut; no Episode 3 thumbnail yet. Landscape visually reviewed; vertical inherits the standard framing but has not been individually art-directed.
- All 18 tests pass, including continuity with Episode 2, finite transforms, reversible effects, spear contact, and honey retention. Shot timing edits must also update choreography cues.

- Motion update (2026-09-19): floor-safe pickup with an airborne spin, continuous wind-up through release, skeptical four-rabbit reaction at 17–19s, then a three-rabbit panic/escape at 34–39s. Escape paths fan into the forest with clear lanes and a camera pullback. Grin/laugh now plays at 39–47s. Rabbit acting additions live in `src/characters/rabbitActing.js`.

# TikTok workflow setup (2026-09-20)

- Episode 3 video creation is complete; the user is handling post-production.
- Separate TikTok collection: `/?collection=tiktok`, registered in `src/tiktok/catalog.js`.
- TikTok uses video → scenes → shots, locked to 1080×1920; MP4s save in `exports/tiktok/`.
- Use unique `tiktok-` video/scene IDs. Existing episode URLs, formats and exports remain supported.
- First TikTok: **Meet Balu**, `src/tiktok/intro/`, 35.657333s, four shots, silent 1080×1920.
- Add original dialogue at 00:02.000 in post; two seconds of idle at both ends. No added mouth or audio track.
- Body acting follows local audio energy plus transcript beats; expressive brows/eyes stay local to this scene. Preserve clear muzzle for the user's post-production overlay.

# TikTok intro V2 (2026-09-20)

- Dynamic alternative is `src/tiktok/introV2/`, scene `tiktok-intro-v2` under `tiktok-intro`.
- V1 remains intact and is still the default scene. Select **Balu · made of code** for V2.
- Same recording offset (00:02.000), duration and two-second idle handles; silent, no added mouth.
- 17 shots with a motion/text hook, expressive reactions, code/wireframe reveal, hero cape, captions, follow prompt and comic farewell.
- MP4: `exports/tiktok/tiktok-intro-v2-vertical.mp4`. All visuals are procedural.

# Episode 3 thumbnail (2026-09-21)

- `src/scenes/bearEp3Thumbnail.js`: procedural horror poster, looming bear silhouette and tiny survivors on the left, large scarlet canvas title on the right, fire eyes and blue forest mist. Original text-free PNG preserved as `exports/thumbnail/bear-ep3-no-title.png`. Registered under Episode 3.
- Preview `/?episode=ep3&scene=thumbnail`; PNG `exports/thumbnail/bear-ep3-thumbnail.png` (1920×1080). Episode animation is unchanged.

# TikTok 2 — He only said hi (2026-09-21, revised)

- `tiktok-awkward-hello`, scene `tiktok-awkward-hello-main`, in `src/tiktok/awkwardHello/`. Latest TikTok; both intro versions remain under `tiktok-intro`.
- Revised to 20.85s / nine portrait shots. Both characters keep walking during dialogue. Balu gains subtle eyebags/drooping eyelids, turns seamlessly and walks briskly to the cemetery. Cut to digging inside the ditch beside an existing headstone, then a flower-pluck insert and directly to the final overhead grave pose. The final overhead pullback holds two seconds longer.
- Removed stone placement, shovel pickup, grave entry and reclining. Digging is one weighted scoop with blade-attached dirt and a ballistic toss; internet animation reference is linked in the local README.
- No dialogue/audio/mouths baked in. Suggested starts: “Hi” 1.65s; “Good, how are you?” 2.85s; “…Good” 5.85s. Consult local README for windows.
- Current export: `exports/tiktok/tiktok-awkward-hello-main-vertical.mp4`. Original 69.9s cut preserved as `exports/tiktok/tiktok-awkward-hello-v1-vertical.mp4`.
- Preview: `/?collection=tiktok&video=tiktok-awkward-hello&t=0`. Shot-ID cues, continuous path/tangent and reversible local stress geometry preserve other videos.
