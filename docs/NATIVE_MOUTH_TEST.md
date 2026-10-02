# Native character mouth test

Separate preview: http://127.0.0.1:5173/native-mouth-test.html (`npm run dev`).
This is an opt-in experiment; Be You, all earlier videos and standalone Mouth
Studio remain unchanged. The user liked the first test and requested character-specific
teeth plus the [new-animation dialogue workflow](DIALOGUE_WORKFLOW.md). V2 has Balu's
small tapered teeth; review of this revision is pending.

## Recordings and analysis

Original files remain under `public/audio/native-mouth-test/`:

- `How to get a gf.m4a` → Balu's question (4.288s).
- `Best way.mp3` → rabbit's advice (4.049s).

`node scripts/analyze-native-mouth-test.mjs` regenerates durable 48kHz mono WAVs,
Rhubarb cues, transcript files, source SHA-256 hashes and `generated/dialogue.json`.
The expected text comes from the Be You script; update it in this script if a
new recording changes the wording. Analysis uses the existing local Rhubarb
binary with transcript guidance. Originals are never modified. Only outer
quiet recording handles are gated, with 80ms padding and a sustained-energy
threshold; this removed a spurious consonant in Balu's recording tail. The raw
recognizer JSON is retained. This gate is a test heuristic, not speech detection
for every voice or background condition.

The review conversation has a 0.6s lead, 0.6s gap and 1s tail: 10.537s.
The manifest's start times align to samples and generate `dialogue.wav`.
Recognition metadata is rounded; durations come from decoded WAV sample counts.
Replace recordings and reanalyze together; filenames in the script must match.

## Preview and export

Select a line, Play with audio, pause or drag the timeline. Front, three-quarter
and side views preserve the time. Neutral, friendly and worried expressions
compose with speech. Intensity is bounded at 0.65–1; timing adjustment is ±150ms
(positive anticipates the audio). These adjustments are preview-session settings,
not a saved cue editor. No automatic transcription or take selection is included.

Playback derives scene time from the audio clock. Pause stops the source; resuming
creates a new source at the selected offset, preventing two simultaneous voices.
Mouth poses use absolute time and reproduce during backward seeking.

**Export test MP4** renders both lines at exact `frame/60` times into 1920×1080
PNGs, then FFmpeg encodes H.264/AAC with the sample-aligned dialogue WAV.
The camera gently changes from front to three-quarter. The current expression,
intensity and timing adjustment apply to both lines; camera selection is for
the preview. Controls lock during export. Files:

- `exports/native-mouth-test/native-mouth-test-v2.mp4`
- `exports/native-mouth-test/dialogue.wav`
- `exports/native-mouth-test/qa-v2/` sampled render PNGs

The original V1 MP4 and `qa/` samples are preserved.

The usual scene exporter still produces its existing silent videos. This test
uses a separate local endpoint and temporary folder, with sequential PNG checks.
The static preview can play existing analyzed assets; MP4 export needs port 5174.

## Anatomy and ownership

`src/characters/rigs/nativeMouth.js` declares per-character muzzle radii,
head attachment, opening bounds, cavity depth, lip thickness and fixed teeth and
tongue sizes. Balu has six small tapered crowns with softened tips; the rabbit
retains its two rectangular front incisors. Tooth profile, size and positions are
declared per character and stay fixed during speech. The original muzzle is hidden only on opted-in instances. A
procedural skin annulus surrounds a recessed cavity, with shared-topology viseme
morph targets and corner expressions. There is no intact solid muzzle behind
the opening. Teeth are concealed on closed/rest poses; the tongue uses bounded
poses. Native facial surfaces are one connected head assembly. No bone is scaled
and no skeleton attachment moves. This is stylized surface articulation, not a
general jaw/contact or feeding simulation. Facial contact with external props
has not been implemented or validated.

The old rabbit mouth/jaw visual is hidden in this preview; native speech owns
the new facial surfaces. Expression controls do not add opening to closed
consonants. `actions/shared/speak.js` creates no anatomy and owns only that
native mouth's morph weights, internal poses and lip markers. Scene head/eyes,
camera, dialogue scheduling and audio transport are separate owners.

`tests/nativeMouth.test.js` covers closure including the quiet tail, fixed
attachments, finite target geometry/normals, bounded controls, restoration on
disposal and forward/backward poses across the real two-line edit. Browser QA
checks actual audio playback, selector changes, pause, scrub and camera views;
export QA checks decoding and sound/dimensions. Visual plausibility and perceived
lip-sync accuracy remain user-review questions.

First test validation: all 74 project tests and the production build pass.
Head/ear bounds are sampled from actual deformed vertices in front, angled and
side views, including narrow preview aspects. The 10.54-second H.264/AAC MP4
decodes fully. Decoded dialogue matched the aligned WAV with zero measured
sample offset in two checked sections (one per voice). Render samples and a
contact sheet are preserved beside the MP4. This verifies transport/export
alignment, not the recognizer's phonetic accuracy or artistic approval.

V2 validation: all 75 tests and the build pass, including distinct tapered bear
teeth and preserved rabbit incisors. Front and angled speaking poses were visually
checked. The 10.54s 1920×1080/60fps H.264/AAC revision decodes fully; its decoded
dialogue is identical to V1's aligned audio. V2 samples and tooth previews are
in `qa-v2/`. User review of the revised tooth style is pending.
