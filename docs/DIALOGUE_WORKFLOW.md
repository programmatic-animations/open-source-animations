# Dialogue workflow

Applies to new animations whose script includes spoken dialogue. Default deliverable:
native procedural mouths, character acting and an MP4 with the user's recorded
dialogue included. The user retains creative control through review and editable
audio, cues, scheduling, expressions, acting and cameras. Existing videos retain
their approved workflow unless the user requests migration.

## Intake: request missing recordings

1. Identify every spoken turn by stable line ID, character and exact script text.
   Action directions such as “calm down” are not dialogue unless marked as spoken.
2. Inspect `public/audio/<video-id>/` and any location the user supplied. Prefer one
   recording per turn; WAV, MP3 and M4A are accepted. Preserve originals and natural
   delivery, including accents. Arbitrary filenames are fine; map them explicitly.
   A combined recording is usable with verified speaker/line boundaries.
3. Check that files decode and that each required turn has a usable take. If a file
   is missing, empty, unreadable or ambiguously mapped, ask a concise question
   listing the affected lines/speakers and the intended folder. For example:
   “Please put Balu's ‘Vokey’ and the rabbit's final line in
   `public/audio/tiktok-be-you/`; filenames and audio format can vary.”
4. Continue independent world/rig/staging work while waiting. Final dialogue timing,
   lip-sync and final export require the actual recordings. Do not invent delivery,
   substitute voices, generate TTS or silently omit dialogue. An explicitly requested
   silent draft may use clearly provisional timing.

Do not require a second upload when usable files already exist elsewhere in the
workspace. Ask about line/speaker mapping only when the script and recordings do
not resolve it.

## Prepare and schedule

- Normalize copies with FFmpeg; keep originals intact. Measure duration from WAV
  sample counts. Analyze each spoken turn with local Rhubarb and its exact transcript
  as guidance. Store WAVs, raw and edited cue JSON, source hashes and transcripts in
  `public/audio/<video-id>/generated/`.
- Record line ID, character/actor ID, source file, hash, audio URL, duration, cues and
  scene start in a durable dialogue manifest. Multiple actors of the same species
  still need distinct speaker IDs. Anchor starts to stable shot IDs or explicit scene
  time; document pause/overlap decisions. Preserve room for reactions and breathing.
- Build shots and gesture beats around the actual delivery. Do not stretch the voice
  to fit a guessed shot length. When retiming, update shots, body/head/eye actions,
  mouths, effects and the audio stem together; no automatic story retiming exists.
- Review recognition errors, especially short closures, quiet tails and fast speech.
  The test's outer-silence gate is a heuristic; do not apply it blindly to quiet voices.
  Persist manual cue corrections and offsets if used in a production scene.

## Character mouths and scene integration

`src/characters/rigs/nativeMouth.js` defines Balu and rabbit anatomy;
`src/characters/actions/shared/speak.js` is the reusable absolute-time controller.
The agent decides whether a new character can reuse a mouth, needs adapted
dimensions/teeth or needs a new mouth family. Declare anatomy centrally before
motion. Each character keeps appropriate dentition and a fixed head attachment;
all visuals remain procedural Three.js. Balu's tapered teeth are not rabbit incisors.

Create a mouth once per opted-in actor, then create `createSpeak({ mouth, cues })`
for each line. Evaluate each active line with `speech.update(sceneTime - line.start)`;
restore that actor's mouth to rest outside its dialogue windows. Reset every actor
on every evaluation so direct/backward seeking cannot leave a stale open mouth.
Plan same-speaker overlaps explicitly rather than letting two actions overwrite
one mouth. Speech owns native mouth surfaces/teeth/tongue/lip markers; scene actions
own body, head, eyes and camera. Avoid the old jaw visual or an expression action
opening the mouth independently. Keep closed consonants closed when smiling.

Use an audio clock for live dialogue playback; resume at the selected offset and
stop old audio sources on pause/seek/navigation. Offline rendering must evaluate
the same scene and cues at exact `frame / fps` times. Keep muzzles readable during
speech and inspect both front and angled views, including the selected output format.

## Export and verify

Mix the unchanged normalized recordings at the manifest's sample-aligned starts
into a dialogue WAV stem. Render the scene using that same schedule, then mux the
stem into the final MP4 with FFmpeg. Verify the manifest/source hashes at export
start so stale cues cannot accompany replaced recordings. Include dialogue by
default; optionally deliver a separate stem or silent version if the user wants it.
Never overwrite a versioned review movie without preserving it.

Check required-line coverage, finite/fixed anatomy, mouth closure/rest, reversible
seeking, actual audio playback and transitions. Review speaking shots and decoded
MP4 samples, dimensions, duration, audio presence and alignment. Transport alignment
does not prove phonetic accuracy; inspect lip-sync and retain the user's review.
Document recording locations, line mappings, timings, preview/export paths and
remaining limitations in the video's local README and the current `AGENTS.md` handoff.

## Working reference and current limits

The complete two-line reference is `src/nativeMouthTest/scene.js` (mouth/scene),
`src/nativeMouthTest/main.js` (audio clock and frame capture),
`scripts/analyze-native-mouth-test.mjs` (analysis, manifest and stem), and
`scripts/native-mouth-export.mjs` (PNG frames → MP4 with dialogue).
See [Native mouth test](NATIVE_MOUTH_TEST.md) for setup and review assets.

The analyzer and export endpoint currently target that test. The ordinary
episode/TikTok exporter still produces silent files. For each new production
dialogue scene, implement or extend its analysis, preview and export integration
using these components, then verify the whole result. Merely attaching a mouth
does not add audio to the existing exporter. Be You has not been migrated by this
workflow update; its existing silent draft remains available.
