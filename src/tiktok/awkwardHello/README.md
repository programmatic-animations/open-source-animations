# He only said hi — crisp revision

Preview: `/?collection=tiktok&video=tiktok-awkward-hello&t=0`.
Silent 1080×1920; 20.85 seconds, nine shots. All dialogue and mouths are added in post.

| Time | Beat / suggested dialogue |
| --- | --- |
| 0–1.4 | Stroll, establish the footpath |
| 1.4–2.7 | Walking two-shot: monkey “Hi” around 1.65 |
| 2.7–4.9 | Tracking Balu: “Good, how are you?” around 2.85 |
| 4.9–6.55 | Eyebrow first; monkey “…Good” around 5.85 |
| 6.55–8.3 | Eyelids sink and eyebags appear; turn begins at 7.45 without stopping |
| 8.3–10.5 | Brisk continuous curve toward the cemetery |
| 10.5–13.1 | Cut to Balu already inside the ditch: plant, lift, tip dirt over the rim |
| 13.1–14.05 | Close insert: paw reaches and plucks the flower |
| 14.05–20.85 | Hard cut to the settled grave pose; brief hold then overhead pullback |

No headstone placement, shovel pickup, grave entry or reclining animation. The stone is already in place. The previous MP4 is preserved as `exports/tiktok/tiktok-awkward-hello-v1-vertical.mp4`; current export is `exports/tiktok/tiktok-awkward-hello-main-vertical.mp4`.

## Acting and reference

Digging uses the planted/bent torso, separated grip and lifting weight shift shown in [Nathan Fleury's Wheelbarrow Shoveling Body Mechanic Animation and extreme poses](https://mindsetiseverythinganimation123.artstation.com/projects/49Z2Jq). The procedural bear adapts these principles to one short scoop. No reference imagery or animation assets are imported. Dirt stays on the blade until release, then follows an arc outside the grave.

`shots.js` owns durations and the continuous turn path. All scene cues use stable shot IDs and local time. Retiming a shot may require retiming its local action; the remaining cut boundaries derive automatically. Stress geometry is local to this scene, preserving the shared bear. Seeking resets all poses, props, camera orientation and facial additions.

Validation covers continuous walking, tangent-aligned turning, reversible state, realistic arm reach and shovel contact, stress visibility, and the flower-to-overhead cut.
