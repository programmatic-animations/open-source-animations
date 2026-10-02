# Be You — first animation draft

TikTok / YouTube Shorts, silent 1080×1920. Preview:
`/?collection=tiktok&video=tiktok-be-you&t=0`.

Status: **V1, awaiting artistic review**. Thirty seconds, thirteen shots, one
shared forest clearing. The full dialogue performance, finger reveal, blazing
eyes, multicoloured aura, rabbit wind/recovery and notebook ending are animated.
Review export: `exports/tiktok/tiktok-be-you-v1-vertical.mp4`;
normal export: `exports/tiktok/tiktok-be-you-main-vertical.mp4`.
All visuals are procedural Three.js; the page wording is canvas typography.

Balu is voiced by the user in his natural Indian accent. Suggested style:
earnest, conversational and literal. Rabbit: breezy self-help confidence that
turns into panicked shouting. Write clear phrases and pauses rather than a
phonetic accent. Keep the user's “Vokey” as written; do not invent additional
accent spellings. Dialogue/audio and mouth overlays are added in post.

| Approximate time | Speaker / line or visual beat |
| --- | --- |
| 0.20–3.20 | Balu: “Bro, how to get a girlfriend bro?” |
| 3.75–7.75 | Rabbit: “Brother, best way to get a girlfriend is to be yourself.” |
| 8.30–9.25 | Balu: “Be myself?” |
| 9.82–11.10 | Rabbit: “Yes, don't hold back.” |
| 11.52–12.15 | Balu: “Vokey” — tiny beat before the eruption |
| 12.50–13.85 | Hand insert: fingers pop out in staggered order |
| 13.85–14.90 | Eyes ignite in close-up |
| 14.90–18.50 | Wide, low-angle release: layered blue, violet, gold and orange fire; shockwave and flying leaves |
| 18.95–22.55 | Rabbit, fighting the blast: “Brooo, you should totally be someone else!” |
| 23–25 | Stay on the rabbits: the gush ceases, they pitch forward and steady themselves; ears and debris settle, revealing the power-down |
| 25–26.70 | Balu takes the notebook from its belt loop and raises it |
| 26.70–28.35 | Page insert: the pencil crosses out “Be myself” at 27.05–27.72 |
| 28.35–30 | Eyes fall, then head follows; hold the quiet disappointment; end |

“Calm down” is a visual beat, not extra dialogue. The power-down must be
communicated through the rabbits' recovery before the notebook cut. Balu's
sadness follows crossing out the advice; do not turn it into another spoken joke.
Keep speaking muzzles clearly visible for post-production overlays.
The rabbits brace on planted feet and pitch forward when the force ends. Their
ears trail, flutter and settle; their positions persist through the cuts.

`shots.js` owns durations and cameras; `dialogue.js` derives spoken windows from
shot IDs. `scene.js` schedules absolute-time performances in `performance.js`,
`face.js`, `effects.js` and `notebook.js`. Final recordings may change the
windows; retime shots and choreography together. There is no audio or phoneme
animation baked in; the nonverbal transformation smile is local expression.

Anatomy is the opt-in constrained rig. `rigs/powerHands.js` declares fixed-size
four-finger extensions before the reveal; visibility and rotations animate,
never bone lengths. Rounded paws remain. Fingers retract during the rabbits'
recovery, before the notebook cut. The reusable `rabbit/windBrace.js` and
`balu/notebook.js` actions are documented in `docs/ACTIONS.md`.

The pencil belongs to the right wrist from the opening. The pad hangs from a
flexible belt loop, transfers to the left palm at 25.35, then follows a rigid
attachment. A back grip supplies measured palm contact; the fixed pencil tip
reaches the page through bounded arm solving. Blocked reaches prevent attachment.
All camera, lighting, particle, expression, prop and joint states seek reversibly.

Story design research applied to this draft:

- [Choosing poses for an acting shot](https://www.animationmentor.com/blog/choosing-the-best-poses-for-your-acting-shot/): use a few readable gesture accents, engaged torso/head, and pauses around changes of thought.
- [Animating dialogue](https://www.animationmentor.com/blog/some-tips-for-animating-dialogue/): make body acting readable before mouth animation; keep speaking muzzles clear.
- [Anticipation](https://www.animationmentor.com/blog/anticipation-the-12-basic-principles-of-animation/): the nod and hand tension prepare the eruption, followed by faster insert cuts and a wide release.
- [Animating sadness](https://www.animationmentor.com/blog/the-6-basic-emotions-animating-sadness-with-tim-ingersoll/): eye reaction precedes the quieter head/shoulder response at the ending.
- [Slip and recovery](https://www.animationmentor.com/blog/tutorial-animate-character-slip-and-recovery/): loss of resistance creates an overshoot, then delayed balance and ear settling.

Validation: 70 tests and the production build pass. The five Be You tests cover
the exact script, whole-scene reverse seeking, 1,801 collision/joint/foot samples
at the exported 60 fps (including fixed finger attachments and rotation limits),
paper contact and the rabbits' recovery, plus portrait bounds during dialogue.
Notebook construction also preflights 241 poses. These are sampled checks for
this staged action, not a general physics or reach-planning system.

The 30-second 1080×1920 H.264 file has no audio, passes full decoding, and was
visually sampled across all thirteen shots plus the wind-stop/recovery beat.
Review frames and a contact sheet are in `exports/tiktok/be-you-qa/`.
