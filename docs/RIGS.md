# Character anatomy and rig contracts

Author in this order: **anatomy → constrained rig → reusable action → scene performance**.
New actions must use a character's declared rig. They must not create replacement limbs, move attachment points, scale bones, or bypass joint limits to reach a target. If a reach fails, change staging or author a supported whole-body movement. Never attach a prop that was not reached.

## Implemented opt-in rigs

`src/characters/rigs/contracts.js` is the numeric source of truth for Balu and rabbit: dimensions, local attachment coordinates, rotation axes and limits. `createCharacterRig('balu' | 'rabbit')` in `createCharacterRig.js` constructs their hierarchy and permanent rounded paws. These are working designs awaiting artistic approval; legacy `createBear` and `createRabbit` callers remain unchanged.

Coordinates: +Y up, +Z forward; left/right follow existing character names (left is negative X). Lengths use scene units. Limits are authored in degrees and stored in radians; `setJoint(name, {x,y,z})` accepts radians using Three.js XYZ Euler order. Unspecified axes return to their neutral/clamped value. A zero-width limit locks that axis. Limits apply through this API and the constrained reach solver; exposed Three.js nodes are not tamper-proof.

Hierarchy:

- Root → pelvis → torso → head; face details are fixed to the head.
- Torso → shoulder → elbow → wrist → paw and palm contact marker.
- Pelvis → hip → knee → ankle/foot.
- Rabbit head → independent ear pivots (inner and outer ear together), and jaw hinge.

Each joint's translation is its fixed attachment; only declared rotations animate. Root locomotion and supported pelvis motion position the whole skeleton. Balu upper arm/forearm are 0.43/0.43 units; rabbit 0.24/0.23. Balu thigh/shin are 0.325/0.325; rabbit 0.15/0.15. No animated squash/stretch is enabled. Mesh shaping at construction defines anatomy, not an action-specific deformation.

## Degrees of freedom

| Joint | Allowed motion | Locked motion |
| --- | --- | --- |
| Torso, head | Limited pitch, yaw, roll | Translation relative to parent |
| Shoulder, hip | Limited rotation on three axes | Translation, length changes |
| Elbow | One hinge, 5–150° flexion | Y/Z rotation, extension past neutral |
| Knee | One hinge, 0–135° Balu / 140° rabbit | Y/Z rotation |
| Wrist | Small pitch/yaw/roll | Translation |
| Ankle | Pitch | Y/Z rotation |
| Paw grip | Rounded thumb closure, one hinge | Independent long fingers |
| Rabbit ear | Limited pitch/yaw/roll | Base translation |
| Rabbit jaw | Opening hinge | Y/Z rotation |

See the code contract for per-character signed limits. Bounds are working artistic defaults, not biological claims. Change anatomy centrally and validate consumers; actions must not silently enlarge limits.

## Contacts and state

Each wrist owns a named palm marker; each ankle defines the floor contact origin. Reach solving rotates the real joint hierarchy while preserving lengths and clamping angles. It returns achieved position and error. The pickup uses this marker for attachment and verifies reachability at the contact beat, including when seeking directly to the end.

Normal paws are permanent palm/thumb geometry. Be You explicitly opts into
`src/characters/rigs/powerHands.js`: four fixed-size two-segment fingers attach
to each existing wrist and retain tip contact markers. `POWER_HAND_CONTRACT`
declares lengths, radius and proximal/fan/distal rotation limits. Concealed digits
pop into view in staggered order and unfold through rotations; lengths, base
attachments and scales remain fixed. Their active collision volumes participate
in the normal checks, with only connected wrist seams excepted. They retract
before normal-paw notebook writing. Legacy `horrorHands.js` is unchanged and
remains a separate story asset. New transformation variants must declare anatomy
and transition before actions, rather than inventing fingers inside an action.

Collision is part of the opt-in rig contract. `src/characters/rigs/collision.js` exposes convex mesh volumes, ground/obstacle checks, explicit connected-joint exceptions, and surface-distance contact checks. Connected anatomy may overlap at its joint seam; non-connected solids must remain separated by the contact tolerance. Actions validate dense intermediate samples and return a blocked or unreachable result rather than teleporting a prop through a solid. This is a proportionate sampled test for our procedural characters, not a general physics engine.

Current limits: no automatic footstep planning, general handoff blending, or arbitrary prop-orientation grip solver. Joint bounds and collision checks still do not guarantee convincing silhouettes; review contact and intermediate poses visually.

## Opt-in native mouth test

`src/characters/rigs/nativeMouth.js` declares fixed Balu/rabbit muzzle attachments,
surface dimensions, opening bounds, cavity depth and internal tooth/tongue
anatomy. Prebuilt morph targets deform facial surfaces; no bone scaling or
skeleton attachment changes are used. This is one connected head assembly.
The original muzzle and rabbit jaw visual are hidden only on opted-in instances
and restored on disposal. See [native mouth test](NATIVE_MOUTH_TEST.md) for
ownership, limitations and review. This anatomy is not yet integrated into Be You
or approved legacy scenes. External prop/mouth contacts are not implemented.

Balu has six small, softly tapered teeth; the rabbit retains its two rectangular
front incisors. Teeth sizes, profile and positions belong to each character's
anatomy contract. For a new character, the agent chooses a compatible existing
mouth family, adapts its contract or creates a new family when muzzle shape,
dentition or articulation requires it. Share cue names and `createSpeak`, not
unsuitable anatomy. Validate attachment, closure and front/angled views before
scene use. See [Dialogue workflow](DIALOGUE_WORKFLOW.md).

## Verification and use

`/actions.html` shows the revised Balu pickup and rabbit neutral rig. Tests cover both rigs' axis limits, fixed anchors/scales, hierarchy, pickup planted feet/contact, unreachable targets, and reverse seeking. Existing episode tests guard legacy continuity. Preserve approved legacy scenes until migration is explicitly requested.
