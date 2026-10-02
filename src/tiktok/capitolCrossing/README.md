# TikTok 3 — The coast is clear

Version 3: **21 seconds, eight shots, 1080×1920, silent**. Preview:
`/?collection=tiktok&video=tiktok-capitol-crossing&t=0`.
Export: `exports/tiktok/tiktok-capitol-crossing-main-vertical.mp4`.

Balu waits across from the Michigan Capitol, checks his wristwatch and phone,
takes three small steps toward a brief traffic gap, recoils from a new burst, and gets angry.
He checks the empty street left and right, then crosses toward the Capitol.
A red car strikes him; he flies sideways and lands sprawled with X eyes and his
tongue out. No blood. Add traffic, watch/phone, whoosh, braking and impact sound
in post-production.

| Shot | Time | Action |
| --- | --- | --- |
| waiting | 0–3 | Capitol establishing view; opposing traffic lanes |
| watch | 3–4.7 | Wristwatch check |
| phone | 4.7–6.5 | Phone check |
| false-gap | 6.5–9.5 | Leading foot, traffic burst, startled recoil |
| angry | 9.5–11 | Angry eyebrows and clenched posture |
| left | 11–12.4 | Empty road to his left |
| right | 12.4–13.8 | Empty road to his right |
| crossing | 13.8–21 | Walk, impact at 16.05, landing at 17.10, comic hold |

The entire last sequence is one elevated rear three-quarter shot. A gentle
sideways camera move follows the flight, then eases almost overhead after landing
to reveal the X eyes and tongue; there is no impact cut. The projection
test samples the whole bear through this shot, ensuring it stays within portrait.
Car positions and bear poses derive from absolute time; backward seeking restores
traffic, props, normal eyes, and cameras.

## Assets and reference

Everything is procedural Three.js: existing `createBear`, local expressions,
watch/phone, reusable `createCar` and `createCapitol` factories, road markings,
lighting, trees and canvas lettering. No AI-generated image or downloaded image
is used in the deliverable. Keeping the simple Capitol geometry live preserves
perspective across shots without an additional image asset.

Capitol reference: [Michigan State Capitol — Capitol Square](https://capitol.michigan.gov/history/capitol-square)
and [east-elevation photograph](https://commons.wikimedia.org/wiki/File:Michigan_State_Capitol,_Capitol_Avenue,_Lansing,_MI_-_54383365203.jpg).
Recognizable features are the pale façade, symmetrical wings, columned east
portico and tiered tall dome. This is a stylized setting with compressed distances
and a fictional two-lane traffic layout, not a surveyed street reconstruction.

`shots.js` owns shot boundaries and impact/landing cues. `scene.js` owns acting
and cameras; `props.js` owns the environment and vehicle factories. Keep timing
and choreography together when revising. Prior episodes and TikToks are unchanged.

## Version 2 revision

Burgundy tie follows the chest. The phone stays in his right hand throughout,
opposite the left-wrist watch, including the final pose. A second tiny step
precedes the traffic burst; that burst and recoil are delayed 0.35 seconds within
the existing shot. Duration and all later story cues remain unchanged.

Versioned exports: `tiktok-capitol-crossing-v1-vertical.mp4` (preserved original),
`tiktok-capitol-crossing-v2-vertical.mp4` (this revision). The main export name
also contains V2. All 38 tests pass, including permanent prop attachment, the extra
step, smooth overhead transition, floor clearance and portrait framing.

## Version 3 revision

The final shot has a subtle continuous drift, including its opening walk and
ending overhead hold. Both bead eyes track the actual phone screen while reading.
The first attempted crossing gains a third small step and a short pause; the
traffic burst starts later and still clears before the left/right checks. The
final crossing, impact (16.05s), landing (17.10s), and total 21s timing are unchanged.
Export: `tiktok-capitol-crossing-v3-vertical.mp4`, also saved under the main name.
V1/V2 exports are preserved. All 39 tests pass.
