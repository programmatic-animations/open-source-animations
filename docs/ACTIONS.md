# Character action library

This is the convention and starting inventory for reusable motion. The first Balu pickup and shared motion mechanics are implemented; broader action coverage will grow with scene needs. Existing scene choreography remains valid and must not be rewritten solely to satisfy this convention.

## Discover, reuse, extend

Before adding motion, inspect this inventory and the relevant character helpers. Reuse a suitable action; customize its supported parameters for the story. If none fits, build the action needed by the scene and place reusable character behavior under `src/characters/actions/<character>/`. The first implementation is `balu/pickUp.js`; there is no global action scheduler. Keep scene scheduling, cameras, and location-specific story decisions with the scene.

Share low-level mechanics across characters when useful, but give each character its own performance defaults. Do not force Balu and rabbits to use the same movement rhythm. Add parameters for real needs rather than every hypothetical variation.

All reusable actions must satisfy two additional defaults:

- Define solid volumes for character parts, props, ground, and scene obstacles. Connected joints are the only overlap exceptions. Validate intermediate samples, including contact; a blocked reach must adjust its path or report failure and must never attach or teleport a prop through a solid.
- Evaluate joint trajectories from absolute time with bounded, eased curves. Use a consistent bend direction and deterministic seeds. Do not smooth from the previous rendered frame: backward seeking and export must produce the same angles and contacts.

## Contract for each new reusable action

Document beside the implementation and add an inventory entry here:

- Character, purpose, module/export, and a scene using it.
- Required rig parts and starting pose or supported entry conditions.
- Inputs: target and coordinate space, local time/duration, and supported performance controls.
- Body parts and transforms it owns; how it composes with gaze, expression, locomotion, or other simultaneous actions without overwriting them accidentally.
- Contact and prop-attachment phases, including who owns the object before and after a handoff. Evaluate these consistently when seeking backward.
- Ending pose/state and how the next action can continue or blend from it without a snap.
- Determinism and reset behavior: evaluate from time and explicit inputs, avoid cumulative offsets, and use seeded variation if needed.
- Constraints, validation performed, and review status. Mark user approval only when actually given.

An action can coordinate anticipation, weight shift, contact, effort, and settle. Its phases should remain coherent when timing changes. Camera shots select views of that performance rather than defining separate copies of it.

Verify the constraints relevant to the action: grip alignment, foot sliding, support, object continuity, transition poses, and reverse seeking. Visually review the resulting performance on the actual character before treating it as established reusable motion.

## Starting inventory

| Existing code | Role | Reuse boundary |
| --- | --- | --- |
| `src/characters/actions/shared/speak.js` — `createSpeak` | Absolute-time recorded speech on opt-in Balu/rabbit native mouth surfaces | Requires existing native mouth anatomy and recording-relative cues; owns no body/head joints or props. See [Dialogue workflow](DIALOGUE_WORKFLOW.md) for new scene integration; the separate native-mouth test is the working reference. |
| `src/characters/rabbitActing.js` — `createRabbitActing` | Shared rabbit expression/acting helper with skeptical, fear, running, and phase controls | Inspect rig assumptions before reuse; not a complete locomotion system. |
| `src/characters/actions/rabbit/reachStudy.js` — `createRabbitReachStudy` | Isolated rabbit elbow trajectory diagnostic used by Action Studio | Opt-in study only; demonstrates smooth absolute-time elbow motion and collision validation. |
| `src/characters/actions/rabbit/windBrace.js` — `createRabbitWindBrace` | Planted brace, gust vibration, forward recovery and delayed ear settle in Be You | Constrained rabbit rig; scene owns roots, gaze and expression. First artistic review pending. |
| `src/characters/actions/balu/notebook.js` — `createBaluNotebookAction` | Reach, raise and cross out a held pad in Be You | Constrained Balu, existing paws, root-local pad and wrist-local pencil with declared tip/grip markers. First artistic review pending. |
| `src/tiktok/theBear/acting.js` — `createTheBearActing` | V3-local performance adjustments, including timed honey pickup | Scene-specific choreography, not a generic Balu pickup action. Preserve V3 when extracting or replacing it. |
| `src/scenes/honeyBetrayal.js` | Episode 2 story choreography reused by The Bear | Source timeline, not independent reusable actions; preserve approved animation. |
| `src/scenes/deathToRabbits.js` | Episode 3 story choreography reused by The Bear | Source timeline, not independent reusable actions; preserve approved animation. |

Possible future actions include Balu heavy walk, hesitation, and angry turn, and rabbit hop, mocking laugh, and panic run. These are candidates, not implemented APIs or an obligation to build them all now.

## Implemented: constrained Balu pickup

Read [RIGS.md](RIGS.md) first. `createBaluPickUp` in `src/characters/actions/balu/pickUp.js` now requires `createCharacterRig('balu')`. The old replacement-arm/squash prototype has been superseded. The action creates no anatomy and never scales limbs or body.

Inputs: `{rig, prop, duration=4, effort=0.5, hesitation=0, carry, gripOffset}`. Positive duration is seconds; effort/hesitation clamp to 0–1. Carry is the target palm-marker position; gripOffset is the vector from prop center to contact, both root-local. Source target comes from the prop's initial position. Defaults are validated with the flat honeycomb at `(0.65, 0.12, 0.95)`, scale 0.46. The character root and prop parent must remain stationary during this action; uniform scene transforms are supported.

The action owns the neutral rig's pose and prop position/rotation while active. Torso/hip/knee/ankle rotations provide the reach with planted feet; shoulder/elbow/wrist obey declared limits. The same hands remain in place at rest, contact, lift, and hold. The rounded thumb closes during contact. Prop orientation stays fixed; arbitrary oriented grasps remain future work.

`update(localTime)` deterministically returns phase, attached status, reachError, achieved root-local paw contact, and progress. A failed contact prevents attachment even when seeking to the final carry beat. Placement outside the validated workspace needs review; the solver reports residual error and does not plan a step automatically. Contact tolerance is 0.025 scene units.

The ending carry pose holds beyond duration. `reset()` restores the neutral rig and source prop; `dispose()` releases action ownership and resets, but does not remove rig geometry. Do not visibly reset/dispose a carried pose; general action handoff/blending is still not implemented. Do not run other pose writers concurrently.

Preview: `/actions.html`. Balu pickup and rabbit neutral anatomy are isolated from approved scenes. Tests cover fixed attachments/scales, degrees of freedom, planted feet, contact, unreachable targets, and reversible evaluation. Artistic approval remains pending.

## Implemented: Be You wind recovery and notebook

`createRabbitWindBrace(rig, {start=14.9, stop=23, delay=0})` requires a neutral
constrained rabbit with stationary root and planted feet. Absolute scene time
controls a short brace onset, ear streaming and vibration, followed by a forward
overshoot and balance by `stop+1.75`. It owns torso, head, ears and arms. Scene
performance is evaluated first; wind overrides those joints while active.
Facial gaze and expressions compose separately. It creates no props or anatomy.
Its return value supplies force, brace, stumble and settled state for expressions
and effects. Exit is balanced, with arms held slightly open.

`createBaluNotebookAction({rig, notebook, powerHands, duration=5})` requires
neutral constrained Balu, a stationary root, the pad parented to that root, and
the persistent pencil parented to the right wrist. It uses a fixed back grip
and fixed pen-tip marker; no finger extension is used for writing. Source and
carry targets are root-local. The staged default lasts five seconds; durations
must exceed the fixed 3.6-second final pose knot. Other placements need review.

This action owns the neutral body and arm pose; scene head/expression may be
applied afterward. It reaches at 0.35, lifts through 1.55, contacts the page at
2.05 and crosses out through 2.72. Before contact the pad stays in its belt loop;
after contact a constant wrist-to-pad transform owns its position and rotation.
The scene releases the flexible loop. The pencil's ownership never changes.
The action ends holding the crossed-out pad; evaluate its ending pose to hold,
and provide a continuation before relinquishing pose ownership. Reset is implicit
in absolute-time evaluation, including seeking before attachment.

Bounded marker solving is baked into eased joint tracks with stable seeds.
Preflight checks 241 intermediate poses, solid intersections and actual grip
surface contact. A blocked or unreachable result prevents attachment and is
returned as `failure`; successful updates return phase, progress, writing,
attached status and measured tip/contact errors. Whole-scene tests additionally
sample 1,801 times at 60 fps, including loop release and normal-to-power-hand transitions.
Both actions are visually reviewed in the Be You draft; user approval is pending.
