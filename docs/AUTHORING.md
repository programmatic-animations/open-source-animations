# Episode → scene → shot

`src/episodes/catalog.js` is the entry point. Episode 1 owns the honey trap and laughing-rabbits scenes. Episode 2 owns The Honey Deal. Each episode also owns its programmatic thumbnail.

- **Episode:** ID, title, ordered `scenes`, thumbnail factory.
- **Scene:** ID, title, world/character factory, duration, `shots`, `seekable`.
- **Shot:** stable ID, title, duration, and optional `update(context)` direction. `defineShots()` derives contiguous start/end times.

The preview selectors follow this hierarchy. Choose an episode and scene; choose a shot to pause at its opening. `?episode=ep2&scene=honey-betrayal&t=27` links directly to the reaction. `?episode=ep2&scene=thumbnail` opens the code-rendered thumbnail; **Save thumbnail PNG** writes `exports/thumbnail/bear-ep2-thumbnail.png` at 1920×1080.

## Adding work

1. Build a scene factory in `src/scenes/`, reusing `characters/`, `props/`, and `environment/`. Return `{ config, update(sceneTime) }`.
2. Define its shots in `src/shots/` with `defineShots([...])`. Add stable IDs and durations. A moving shot can use `shotTime` and `progress` from `updateShot()`.
3. Update shared character/prop choreography, then call `updateShot(shots, sceneTime, context)` to apply the selected camera and direction.
4. Register the scene under the correct episode in `catalog.js`. The scene picker and shot picker populate automatically; exports use the scene ID.
5. Keep poses derived from absolute time if `seekable: true`. Avoid one-time state mutations in shot callbacks. Test backward seeking as well as normal playback.

```js
const shots = defineShots([
  { id: 'establish', title: 'The clearing', duration: 3, update: establishCamera },
  { id: 'reaction', title: 'He notices', duration: 2, update: reactionCamera }
]);
// Inside the scene update:
updateCharacters(sceneTime);
updateShot(shots, sceneTime, { camera, characters });
```

## Existing scene boundaries

Episode 2's 14 actual camera shots live in `src/shots/honeyBetrayalShots.js`; its shared story choreography remains in `src/scenes/honeyBetrayal.js`. Camera definitions now drive playback, not merely labels. The inserted reaction's time mapping preserves the approved animation. Changing shot durations requires updating shared choreography cues too; this is not an automatic retiming system.

Episode 1's two original scenes each use one uninterrupted camera take. Their durations match the existing exported files (26.31s and 13.07s). Their legacy stateful animation is not marked seekable. They can be selected and played from the beginning. Full-episode concatenation is not implemented; playback/export operate on the selected scene.

Thumbnail composition and text are editable in `src/scenes/bearEp2Thumbnail.js`. It uses Three.js character factories and canvas text, with no generated bitmap assets.

Validation: `node --test tests/*.test.js` and `npm run build`.
