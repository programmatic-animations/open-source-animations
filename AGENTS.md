# Working agreement

For any new agent continuing the latest video: read this file first, then `README.md`, `docs/AUTHORING.md`, `docs/ANIMATION_PRINCIPLES.md`, `docs/RIGS.md`, and `docs/ACTIONS.md` before editing. The latest handoff below is authoritative for current story/version status; inspect fresh git state and preserve all existing workspace changes.

- **Optimize tokens without compromising quality.** Keep updates and answers concise; inspect only relevant files, batch independent reads, and avoid repeating context or checks without cause.
- **Keep audio/video local:** never commit or push recordings, normalized audio, dialogue stems or rendered movies, including ZIPs containing audio/video. Preserve local copies; `.gitignore` excludes media formats and export ZIPs. Check staged paths before committing and never bypass these rules with `git add -f`. Source code, documentation, cue/transcript JSON/text and thumbnails may be tracked.
- **Scripts with dialogue:** read `docs/DIALOGUE_WORKFLOW.md` before timing or animating speech. New dialogue animations default to native character mouths and an MP4 containing the supplied dialogue. Inspect available recordings first; if any spoken turn lacks a usable file, request the missing recordings, naming the lines/speakers and `public/audio/<video-id>/` destination. Never silently finish a dialogue animation without its voices. Independent staging can continue while awaiting files; a silent draft requires the user's explicit request.
- The agent chooses whether to reuse, adapt or create a mouth rig to suit each character. Shared speech cues do not imply shared teeth or muzzle anatomy. Preserve exact script wording and the user's creative control; recordings, cues, timing and acting stay editable. Existing approved silent videos and standalone Mouth Studio are not migrated automatically.
- All animation and thumbnails must be **programmatically created** using our Three.js characters, geometry, lighting, cameras, and canvas typography. Do not use AI image generation for deliverables.
- Favor expressive acting and cinematic cuts that make the story clear. Preserve approved animation unless the request changes it.
- Organize work as **episode → scenes → shots**. Reuse character/prop factories. See `docs/AUTHORING.md` when changing the structure or timing.
- Before creating or revising animation, read `docs/ANIMATION_PRINCIPLES.md` and apply it as default artistic and engineering judgment: shared locations, persistent story state, precise framing, motivated lighting, believable character motion, and reusable character actions. Consult `docs/ACTIONS.md` before adding motion; reuse or adapt suitable actions and document new ones. These are authoring conventions, not a claim that legacy scenes already implement them.
- Define anatomy before actions: read `docs/RIGS.md`. New reusable motion must use declared attachment points, fixed proportions, joint degrees of freedom/limits, and contact markers; do not invent or replace limbs inside actions.
- Treat collision and trajectory quality as default action requirements: declare solid volumes and connected-joint exceptions, sample intermediate poses for non-penetration and real surface contact, and report blocked reaches. Evaluate joint curves from absolute time with easing and stable bend direction so backward seeking is deterministic.
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

# TikTok 3 — The coast is clear (2026-09-22)

- First version: `tiktok-capitol-crossing`, scene `tiktok-capitol-crossing-main`, in `src/tiktok/capitolCrossing/`; 21 seconds / eight portrait shots. Awaiting user review.
- Balu waits across from a simplified Michigan Capitol, checks watch/phone, recoils from a false traffic gap, gets angry, checks left/right, then crosses. Fast red car launches him into a sprawled X-eye/tongue-out landing. Cartoon impact; no blood.
- Final 13.8–21s is one elevated rear three-quarter shot, with a gentle camera follow during the flight. Impact 16.05s, landing 17.10s. Absolute-time choreography supports reversible seeking.
- Capitol, cars, road, watch, phone and all other visuals are procedural Three.js. Reference links and shot notes are in the local README. Street geometry is stylized; not a surveyed reconstruction.
- Preview: `/?collection=tiktok&video=tiktok-capitol-crossing&t=0`. Export: `exports/tiktok/tiktok-capitol-crossing-main-vertical.mp4`. Silent, sound added in post.
- All 37 tests pass, including actual car/body contact, opposing traffic and clear checking windows, reversible expressions/props, and sampled full-body portrait bounds during the entire final shot.

# TikTok 3 — version 2 (2026-09-22)

- Adds a burgundy tie and permanent right-hand phone opposite the left-wrist watch, including the landing.
- First crossing attempt has an additional tiny step; traffic burst/recoil shift 0.35s later within the same shot. Overall duration remains 21s; impact and landing cues are unchanged.
- After landing, the final camera slowly moves almost overhead to reveal the X eyes and tongue.
- Original export preserved as `exports/tiktok/tiktok-capitol-crossing-v1-vertical.mp4`; revision saved as `tiktok-capitol-crossing-v2-vertical.mp4` and the usual main export. All 38 tests pass.

# TikTok 3 — version 3 (2026-09-22)

- Continuous subtle camera drift through the whole final shot, including the walk and ending overhead hold. Eyes now aim at the phone screen during the phone check.
- Extra third small step and brief pause apply to the **first attempt only**, followed by a later traffic burst. Final crossing choreography/timing, impact 16.05s, landing 17.10s and 21s total stay unchanged.
- Export: `exports/tiktok/tiktok-capitol-crossing-v3-vertical.mp4` and main name; earlier V1/V2 exports preserved. All 39 tests pass.

# TikTok 4 — The Bear combined cut (2026-09-23)

- First version combines Episodes 1–3: `tiktok-the-bear`, scene `tiktok-the-bear-main`, in `src/tiktok/theBear/`; 61.1 seconds, 26 portrait shots. Awaiting user review.
- Honey reach hook → trap/mockery → bargain/ladder → hesitation/handover → betrayal → transformation → implied retaliation → survivor escape → grin/laugh.
- Separate source-time edit map and portrait cameras reuse isolated episode worlds. Episode 1 is baked at 60 Hz for reversible seeking; its factory only adds actor references. Original episode choreography is unchanged.
- Cut precedes spear contact; victim and graphic aftermath are suppressed locally. Geometric forest, brighter horror fill, and an inside-pit reaction camera keep this cut readable.
- Review MP4: `exports/tiktok/tiktok-the-bear-v1-vertical.mp4`; clean silent version: `tiktok-the-bear-v1-silent-vertical.mp4`; separate procedural WAV alongside. Normal browser preview/export remain silent.
- `soundtrack.py` regenerates original synthesized foley from the edit map. See the local README for timing, QA and output details. No audience performance results yet.

# TikTok 4 — V2 full story cut (2026-09-23)

- User rejected the 61.1-second V1 because pacing and story beats were lost. V2 is 121.7 seconds / 36 shots, silent 1080×1920.
- V2 restores scent, climb, branch break, pit recovery, rabbit reveal/laughter; preserves all Episode 2 and 3 shot durations and choreography, including Episode 3's horror payoff. Only inactive Episode 1 tail and redundant late laughter are trimmed.
- `src/tiktok/theBear/scene.js` combines four isolated worlds with portrait cameras; both legacy Episode 1 scenes are baked at 60 Hz for reversible seeking. Existing source episodes stay intact.
- V2 MP4: `exports/tiktok/tiktok-the-bear-v2-vertical.mp4` (silent). Do not add audio/sound design for this cut. V1 versioned artifacts remain as history.

# TikTok 4 — V3 story and acting pass (2026-09-23)

- Current cut: 111.7 seconds / 32 shots, silent portrait. Preview `/?collection=tiktok&video=tiktok-the-bear&t=0`; versioned review export `exports/tiktok/tiktok-the-bear-v3-vertical.mp4`.
- Opens on an upside-down nostril-flaring Balu face, then honey/bees and a step-vibrating branch, then the break. Pit starts on seated Balu with legs forward; two bees circle and exit on his head lift, continuing into the rabbit reveal.
- TikTok-only `src/tiktok/theBear/acting.js` adds articulated honey pickup and hides floating rim stones. After second fall, Balu's body faces the rabbits while his downward gaze stays; angry face camera pushes in.
- Finger emergence is one push-in shot. Point is aimed into the rabbits' high-angle camera with the fallen body visible. Reaction immediately after body fall is removed; point is followed by one slow-push three-rabbit reaction, then three visible fleeing rabbits. Final shot keeps the head pan and pushes to a tight grin.
- Original episode timelines and animation remain available. No sound or audio track for V3. V1 and V2 files remain preserved.

# TikTok 4 — V4 story and continuity pass (2026-09-25)

- Earlier review cut: **The Bear V4**, 117.55 seconds / 40 portrait shots, silent. V3 remains selectable as `tiktok-the-bear-v3` with its source and versioned MP4 preserved.
- V4 opens on honey and bees, then scent, decision, climb, fall and pit landing. The pit is reconstructed at Episode 2's depth and palette. The four-second reluctant choice is split into face and offered-paw views; a hurt beat follows the second fall before anger.
- The TikTok-only pickup uses Balu's existing arm and continuous paw-to-honey contact, with no temporary replacement limb or limb stretching. The revenge arm reset that hid his fingers is removed in V4. Fallen ladder, forest and survivor positions remain persistent across the final cuts.
- Preserved V4 files now carry a `V4` suffix; V3 files carry a `V3` suffix. V4 review MP4: `exports/tiktok/tiktok-the-bear-v4-vertical.mp4`. See local README and `tests/tiktokTheBearV4.test.js`.

# TikTok 4 — V5 full directing pass (2026-09-29)

- Latest/default review cut: **The Bear V5**, `tiktok-the-bear-main`, 114.65 seconds / 44 portrait shots, silent. Preview `/?collection=tiktok&video=tiktok-the-bear&t=0`; versioned MP4 `exports/tiktok/tiktok-the-bear-v5-vertical.mp4`. Awaiting user artistic review.
- The opening connects scent to a visible approach, stages the climb against the tree, and separates branch crossing from its warning. The first pit recovery has struggle and look-up views, with bees kept clear of Balu's face. The bargain isolates the demanding rabbit and changes the ladder ascent from effort to hope. A repeated angry face hold is shortened. After Balu points, all three survivors share a 1.4-second look before their fast sprint; the sprint's source-time speed is unchanged from the preceding fast edit. The core story remains intact.
- V5 lives in `src/tiktok/theBear/scene.js`, `shots.js`, `acting.js`; the previous cinematic V4 is preserved as selectable `tiktok-the-bear-v4` in the corresponding `V4` files, alongside both V4 MP4s. V3 remains selectable. Source episode animation is unchanged.
- The full MP4 was visually sampled across all 44 shots, and the revised point → shared glance → sprint transition was reviewed in the final render. It decodes fully at 1080×1920 with no audio. All 65 tests and the production build pass. See local README and `tests/tiktokTheBearV5.test.js`.

# TikTok 5 — Be You: first animation draft (2026-09-30)

- User confirmed The Bear is done. New short: **Be You**, video `tiktok-be-you`, scene `tiktok-be-you-main`, in `src/tiktok/beYou/`. TikTok / YouTube Shorts portrait, silent; dialogue and mouth overlays in post.
- Current concept: Balu asks how to get a girlfriend; rabbits advise being himself. His delighted authenticity becomes an enormous anime-style power-up, fingers emerging and eyes blazing inside multicoloured fire. Rabbits revise their advice while struggling against the blast.
- Show the aura stopping through the rabbits pitching forward, catching/steadying themselves and settling ears, then cut to Balu crossing “Be myself” out of a notebook. Do not show a separate Balu power-down before their recovery.
- Balu will be voiced by the user with his natural Indian accent. The current user-authored lines are stored exactly in `dialogue.js` and the local README, including “Vokey” and “Brooo, you should totally be someone else!”; timings remain provisional until recording. Add no invented accent spellings.
- First animation draft: 30 seconds / 13 portrait shots, awaiting user artistic review. Exact dialogue is staged with clear muzzles, gesture accents and brief thinking beats. Hand and eye inserts lead into a low-angle multicoloured procedural fire release, then wind-braced rabbits and their recovery. Preview `/?collection=tiktok&video=tiktok-be-you&t=0`.
- After the rabbits steady, Balu takes out the notebook, crosses out “Be myself”, and his face turns sad; end on that quiet disappointment. “Calm down” denotes action, not a new dialogue line.
- Shot-relative dialogue windows derive from stable IDs. Preserve earlier videos; retime acting/shots together after recording. `src/characters/rigs/powerHands.js` declares opt-in fixed-size fingers with joint limits and collision volumes; existing paws and legacy horror hands remain. No bone scaling.
- Notebook: persistent right-paw pencil; pad transfers from a belt loop to the original left paw at 25.35, with measured back-grip contact. Pencil/page contact crosses out the advice at 27.05–27.72; sad eyes lead the head response. New reusable actions are `balu/notebook.js` and `rabbit/windBrace.js`; see `docs/ACTIONS.md`.
- Review MP4: `exports/tiktok/tiktok-be-you-v1-vertical.mp4`; normal export: `tiktok-be-you-main-vertical.mp4`. Silent 1080×1920; audio and mouth overlays remain in post. Research links, dialogue windows and ownership/validation notes are in the local README.
- All 70 tests and the production build pass, including 1,801 collision/contact and fixed-anatomy samples at the exported 60 fps, speaking-head portrait bounds and reversible effects, lighting, props and cameras. The full 30-second MP4 decodes correctly at 1080×1920 with no audio; all 13 shots and the recovery were visually sampled. Earlier videos remain intact. This draft has not been user-approved.

# Native mouth test (2026-10-02)

- User supplied `public/audio/native-mouth-test/How to get a gf.m4a` (Balu) and `Best way.mp3` (rabbit). Originals are preserved. Separate preview: `/native-mouth-test.html`; Be You and previous videos are unchanged.
- Local transcript-guided Rhubarb analysis writes durable WAV/cue/manifest assets into `generated/`. Regenerate with `node scripts/analyze-native-mouth-test.mjs`; see `docs/NATIVE_MOUTH_TEST.md`.
- Opt-in `rigs/nativeMouth.js` replaces the visible muzzle surface with procedural morph geometry around a recessed cavity. Fixed anatomy, head parenting, restrained speech and expression controls; `actions/shared/speak.js` owns only the native mouth. No AI visual generation.
- Audio-clock preview supports pause, seek, front/angled views and expressions. Dedicated test export evaluates exact 60fps frames and combines the sample-aligned dialogue WAV into a 1920×1080 MP4. The normal episode/TikTok exporter stays silent.
- User liked the first native-mouth test and chose dialogue included in final exports, with creative control retained. No production-video integration or general cue editor yet. Existing uncommitted workspace changes are preserved.
- V2 removes rabbit incisors from Balu and gives him six small, softly tapered teeth; rabbit incisors are unchanged. Tooth anatomy belongs to each character's contract. The agent decides whether to reuse, adapt or create mouths for new characters.
- Current review: `exports/native-mouth-test/native-mouth-test-v2.mp4`, 10.54s, 1920×1080/60fps with both supplied voices. V1 and its QA are preserved. All 75 tests and the build pass; front/angled teeth and rabbit anatomy were visually checked. Full V2 MP4 decoding passed; decoded dialogue is identical to V1's already aligned audio. Current samples: `exports/native-mouth-test/qa-v2/`. V2 artistic review is pending.
- New-animation defaults and missing-recording requests are required near the top of this file and detailed in `docs/DIALOGUE_WORKFLOW.md`. Future agents must integrate native mouths, audio-clock preview and export with dialogue for new spoken scripts; the test-specific analyzer/export are references, and existing silent videos remain intact.
