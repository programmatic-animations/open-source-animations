# Mouth Studio

A standalone tool for creating a talking-mouth overlay from recorded speech. The mouth is authored from Three.js geometry, with nine Rhubarb mouth shapes (A–H and resting X), blended by absolute time. This is speech-driven animation rather than a volume-only jaw. Automatic recognition can be imperfect; there is currently no manual cue editor.

## Start

From the repository root, run `npm install`, then `npm run setup:speech` on first setup. The installer downloads the official Rhubarb 1.14.0 distribution into ignored `.tools/`, retaining its license. It selects macOS, Linux, or Windows; the binary must be compatible with the host. Set `RHUBARB_PATH` to use another installed executable. ZIP packaging requires `python3`; installation uses `unzip` on macOS/Linux or `tar` on Windows.

Run `npm run dev` and keep the terminal open. Visit http://127.0.0.1:5173/mouth.html or use **Mouth Studio** in the animation preview. The Vite preview uses port 5173; the export server uses 5174. Restart the servers after changing server code. A static production build alone does not provide the speech backend.

## Create an overlay

1. Choose an audio recording (maximum 30 MB and 120 seconds; decoding depends on bundled FFmpeg).
2. Choose **English** for the speech recognizer or **Other languages (phonetic)** for language-independent analysis.
3. Click **Create lip sync** and wait for analysis.
4. Use Play/Pause and the timeline slider to review. The mouth closes during pauses.
5. Select an export format and whether to include voice, then click **Export transparent overlay**.

The output is centered on a 512×512 transparent canvas at 30 fps. Checkerboard squares are never included. Each export frame is evaluated at its exact timeline time, independent of preview speed. A browser download and a uniquely named copy in `exports/` are created. Position, scale, and time the overlay in your editor; head movement requires editor keyframes or tracking.

## DaVinci Resolve: PNG sequence + WAV

This is the default export and avoids the reported ProRes alpha problem.

1. Extract the ZIP; the inner folder contains numbered PNGs, instructions, and optionally `voice.wav`.
2. On Resolve's Media page, browse to the folder through **Media Storage**. Disable **Show Individual Frames** in its menu so the PNGs appear as one image sequence.
3. Import that sequence. In **Clip Attributes**, set **Video Frame Rate** to **30** and **Alpha Mode** to **Straight**.
4. Place the sequence on a video track above the main animation.
5. Import `voice.wav` separately and align its beginning with the first sequence frame. Move the two together when adjusting timing.

Do not import each PNG as a separate still. If that happens, remove those timeline items and reimport as a sequence. The sequence rate remains 30 fps even if the main timeline has a different rate.

## ProRes MOV limitation

The alternate MOV export uses ProRes 4444 with alpha and optional 48 kHz PCM audio. Local FFmpeg decoding confirms transparency, but the user observed an opaque black rectangle in Resolve despite selecting Straight alpha. The root cause is unconfirmed. Do not treat a successful FFmpeg alpha test as proof of Resolve compatibility; use the PNG option for this project. A player showing black by itself is not conclusive, but black obscuring an underlying clip is a compositing failure.

## Processing and storage

- All analysis runs on the local server; no recording is sent to a cloud speech service.
- FFmpeg makes a 48 kHz PCM voice track and a separate mono 16 kHz analysis track.
- Rhubarb returns timestamped visemes, which drive the reusable mouth geometry.
- Session data lives under `.export-temp/speech/`. Sessions expire after about an hour when idle or become inaccessible after server restart. Re-upload the source recording to continue. Restarted-server files can remain on disk; this is not durable project/session storage.
- Exports remain in `exports/` and browser downloads. Keep original recordings separately.
- Selecting a new file or changing language invalidates the current analysis.

## Troubleshooting

- **Cannot reach export server:** run `npm run dev`; both ports must be available. If starting Vite separately, also run `node export-server.mjs`.
- **Rhubarb missing:** run `npm run setup:speech` or supply `RHUBARB_PATH`, then restart the server.
- **ZIP export fails:** ensure `python3` is installed and available to the server.
- **Session expired:** select the recording and create lip sync again.
- **Poor synchronization:** try a clear voice recording with minimal music/background noise and the appropriate language option. No manual phoneme correction is implemented.

## Code map and validation

| File | Responsibility |
| --- | --- |
| `mouth.html` | Separate Vite entry point |
| `src/speech/studio.js`, `studio.css` | Upload, preview, timeline, and export UI |
| `src/speech/mouth.js` | Reusable Three.js mouth geometry |
| `src/speech/cues.js` | Deterministic mouth poses and smooth transitions |
| `scripts/speech-server.mjs` | Analysis, temporary sessions, frame reception, PNG/MOV packaging |
| `scripts/install-rhubarb.mjs` | Official pinned binary setup |
| `export-server.mjs` | Shared local server and route dispatch |
| `vite.config.js` | Builds animation preview and Mouth Studio |
| `tests/speech.test.js` | Seeking determinism, resting poses, finite geometry |

Run `node --test tests/*.test.js` and `npm run build`. Browser smoke tests have exercised upload, analysis, playback, and downloads. PNG alpha and ZIP integrity were checked; actual Resolve playback is a separate integration check.
