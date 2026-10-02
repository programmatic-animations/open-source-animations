# TikTok 4 — The Bear: Trust has a limit

## V5 — full directing pass (2026-09-29)

V5 is the default **114.65-second, 44-shot, silent 1080×1920** cut. The core
honey → trap → mockery → bargain → betrayal → anger → retaliation → escape
story remains intact. The source episodes and V3 remain untouched. V4's
cinematic pass is preserved as selectable `tiktok-the-bear-v4` in
`sceneV4.js`, `shotsV4.js`, and `actingV4.js`, with its versioned MP4.

The opening now shows Balu following the scent toward the tree instead of
jumping from sniff to climb. His gaze leads the walk and its bounce is reduced.
During the climb, the existing bear turns against the trunk: both original
forearms stay near its surface while his fixed-size body rises clear of the
wood. The camera follows more slowly so the gain in height reads. The long
branch approach becomes a crossing view and a closer warning view before the
break. The first pit recovery has separate struggle and look-up views; the two
bees stay to either side of his face before flying out.

At the bargain, the rabbit making the demand gets its own close view. The
ladder climb moves from physical effort to a view of how close escape seems.
The painful second fall and four-second hesitation keep their established
source timing. The repeated two-second angry face at the start of revenge is
reduced to a short match beat, and the witnesses' reaction is slightly faster.
The three survivors now share a 1.4-second view to register fear and look at
one another. The sprint keeps the same source-time speed as the previous fast
edit, with closer tracking so all three remain readable.
The cool rim light and final grin remain. Daylight in the first two worlds
comes from the same warm direction.

The V5 source lives in `scene.js`, `shots.js`, and `acting.js`; the MP4 is
`exports/tiktok/tiktok-the-bear-v5-vertical.mp4`. Normal export writes the
main scene name. The legacy bear's simple limbs limit grip detail; V5's local
climb uses existing geometry and fixed proportions, with sampled trunk
clearance and paw contact through its sustained middle section. The approach,
first pit recovery, and branch transfer were reviewed in the rendered portrait
cut. Artistic approval remains with the user.

## V4 cinematic review pass (2026-09-29)

The story, source action, 117.55-second timing and silent portrait format stay
the same. After Balu's point, the repeated wide group view becomes a close
view of one survivor's fear, with a small camera push. The cut then opens onto
all three rabbits fleeing. That camera tracks their widening escape lanes and
pulls back as the forest takes over, keeping each rabbit visible. A fixed cool
sky fill at the rim makes their reaction readable through the strike and escape
without brightening Balu's pit. These choices connect his threat to their
decision to run and let the last wide shot show the consequence.

The earlier review MP4 remains `exports/tiktok/tiktok-the-bear-v4-vertical.mp4`.
The revised review is `exports/tiktok/tiktok-the-bear-v4-cinematic-vertical.mp4`.
V4 is selectable as `tiktok-the-bear-v4`. Source episodes, V3, and the rest
of V4's performance are unchanged.

## V4 — story, contact, and continuity review cut

V4 is a **117.55-second, 40-shot, silent 1080×1920** cut. V3 is preserved as a separate selectable scene and in
`exports/tiktok/tiktok-the-bear-v3-vertical.mp4`. The V4 review export is
`exports/tiktok/tiktok-the-bear-v4-vertical.mp4`. No audio is included.

The first shot makes honey and bees the immediate visual hook, then Balu scents
it, chooses the tree, climbs, reaches, falls, lands and recovers. The first pit
and bargain use the same floor depth, wall color and forest layout. Honey is
placed on the floor by the broken branch before the bargain.

The approved Episode 2 timing and choreography remain intact. V4 splits the
four-second reluctance into a facial reaction and a view of the offered paw;
the second fall has a short hurt beat before anger. The pickup uses Balu's
existing arm, with a sampled surface contact and a continuous grip path; V3's
temporary replacement arm is absent. V4 also restores the original revenge
arm motion so the emerging fingers are visible. The ladder stays fallen, the
forest stays present, and the survivors react, turn and run together before
Balu's grin. The final close-up remains the horror payoff.

This is a review cut, not user-approved animation. `sceneV3.js`, `shotsV3.js`
and `actingV3.js` retain the earlier implementation; source episodes are
unchanged. Tests sample reverse seeking, lighting and props, fixed proportions,
pickup contact and prop trajectory, surviving ladder state, and three-rabbit
portrait bounds. Review the MP4 in motion before publishing.

## V3 — story and acting pass

V3 is a **111.7-second, 32-shot, silent 1080×1920** edit of the same continuous
story. Preview: `/?collection=tiktok&video=tiktok-the-bear&scene=tiktok-the-bear-v3&t=0`.
Review file: `exports/tiktok/tiktok-the-bear-v3-vertical.mp4`; normal export
writes the same scene-specific filename. Neither has an audio track.

The opening starts on Balu's upside-down, flaring nose, then reveals the
honeycomb, bees, and vibrating branch before it breaks. He is already seated
when the pit shot begins, legs forward; the same two bees circle him and leave
as he looks up, continuing into the rabbit reveal. The honey pickup adds an
articulated reach, grip, weighted lift, and settle. Rim stones that read as
floating are hidden in this edit.

After the second fall, Balu stands facing the rabbits while keeping his
downward gaze; the camera pushes into his angry face. The finger emergence is
one advancing shot. The point is aimed into the rabbits' camera, followed by
one three-rabbit reaction shot with a slow push. The redundant reaction
immediately after the body fall is gone, and all three survivors remain in the
escape frame. The final shot retains its head pan and pushes from medium close
to a tight grin. Camera and acting changes are local to this TikTok scene;
the original episodes remain intact.

## V2 — previous full story cut

V2 is a **121.7-second, 36-shot, silent 1080×1920** edit of Episodes 1–3.
The deliverable is `exports/tiktok/tiktok-the-bear-v2-vertical.mp4`.
The file is silent.

The complete arc is visible: scent → tree climb → honey reach → branch break →
pit recovery → rabbits reveal and laugh → bargain → ladder → climb → demand →
hesitation → handover → ladder release → fall → anger → transformation →
retaliation → survivors' panic → grin and laugh. The bargain and revenge retain
their full original shot durations and choreography. The only source cuts are
the inactive tail after the first fall and part of the repeated rabbit laughter.
V2 restores the horror payoff that V1 implied.

`shots.js` maps each portrait shot to its source in/out time. `scene.js`
switches four isolated source worlds and provides portrait framing; `acting.js`
adds V3-only physical performance. Both legacy
Episode 1 scenes use 60 Hz transform/parent snapshots from `legacyBake.js` for
reversible seeking. The original episode animation remains unchanged. No music,
sound design, dialogue or audio track is included.

V1 files remain available as prior drafts, including its separate sound pass;
V2 and V3 do not use that pass. The cut is intentionally long so the story can be cut
further in post after review.

Validation: `node --test tests/*.test.js`, `npm run build`, frame review and
full MP4 decode. Audience performance has not been tested.
