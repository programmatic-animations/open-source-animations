# Animation authoring principles

Apply these principles without requiring the user to restate them. Make routine artistic decisions from the story, character, and established world; discuss meaningful creative ambiguities concisely. All deliverable visuals remain programmatic Three.js geometry, lighting, cameras, and canvas typography.

## Locations and continuity

Build a location once and reuse its layout across shots and narrative scenes. Reusing individual trees or props is insufficient if their spatial relationships change between cuts. For The Bear, the honey tree, pit floor, and pit rim belong to one connected location.

Choose a new location when the story moves to a genuinely different setting. A new camera angle, close-up, emotional beat, or scene label alone does not justify rebuilding the environment. Reuse location factories when isolated instances are technically necessary, with consistent layout and explicit story-state transfer or reconstruction.

Carry changes forward: a broken branch stays broken, dropped honey remains at its landing position, and the fallen ladder stays down until moved. Track character positions, prop ownership, damage, and visibility as story state. Derive state from absolute story time for seekable scenes so backward seeking and export reproduce it without relying on previous playback.

## Framing and cameras

Specify start and end compositions using visible body boundaries, headroom, subject placement, and required visible features. Shot names such as medium close-up are shorthand, not sufficient specifications for stylized proportions. Use supplied references to resolve intent.

For example: start at upper chest with shoulders and full ears visible and little headroom; end on the face with both eyes and the full mouth visible. Preserve specified acting throughout. Distinguish a camera push-in from a lens zoom and choose the movement that serves the intended effect.

Review framing in the actual output aspect ratio at the start, end, and relevant intermediate poses. Keep important gestures, contacts, and props readable. Camera cuts must not restart ongoing actions or reset world state.

## Lighting

Establish a location's base light direction, ambient color, and shadow logic. Maintain them across cuts. Introduce artistic changes when motivated by the story: anger may gradually add red to Balu's face, for example. Define the onset, progression, and persistence on the story timeline so each camera inherits the current mood.

Allow subtle shot-specific fill or exposure adjustments for readability while preserving apparent light sources and mood. Avoid unexplained jumps. Emotional lighting may be stylized; it need not imply a literal red lamp. Decide deliberately how it affects nearby characters and the environment and when it fades or changes.

## Character movement

Start with the character anatomy and constrained rig in [RIGS.md](RIGS.md), then implement actions. Fixed attachments, proportions, joint limits, and contact markers belong to the rig. Actions must not replace limbs or alter anatomy to solve a pose.

Develop movement suited to our own proportions and world, rather than copying another production's style. Believability comes from intention, weight, balance, contact, anticipation, and follow-through. Balu can feel heavy and rabbits light while both remain stylized.

A pickup should communicate looking or orienting toward the target, weight shift, reach, grip, lift, and settle as appropriate to the beat. Keep paws attached during grips, planted feet stable, and bodies supported. Coordinate torso, head, limbs, and prop motion rather than interpolating a paw alone. Vary rhythm and overlapping motion to avoid mechanical simultaneous starts and stops.

Use character-specific reusable actions with controls for target, duration, effort, hesitation, emotion, and exaggeration where needed. Reuse a fitting action, adapt its supported controls, or add a new action when the existing vocabulary cannot express the beat. Define entry and exit conditions so actions connect naturally. Schedule actions on the story timeline independently of camera cuts.

Follow [ACTIONS.md](ACTIONS.md). Grow the library from actual scene needs; avoid a speculative framework or changing approved performances merely to migrate them.

## Review and preservation

Check continuity across cuts and inspect key contacts, action transitions, and lighting transitions. For animation changes, use the relevant automated checks plus visual review; verify reversible seeking where supported. Code checks alone cannot establish convincing acting.

Preserve approved animation, versioned exports, and existing workspace changes. Keep revisions local until a shared change is intended, and verify affected consumers when promoting motion into the library. Record new reusable actions and their review status so future agents can find them.

The Bear V4 revision preserves V3 and the source episodes as separate, selectable work. Keep future revisions versioned, review story beats and physical contact in the rendered portrait cut, and leave the cut silent unless requested otherwise.
