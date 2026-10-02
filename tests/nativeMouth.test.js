import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { createCharacterRig } from '../src/characters/rigs/createCharacterRig.js';
import { createNativeMouth, visemeAt, VISEMES } from '../src/characters/rigs/nativeMouth.js';
import { createNativeMouthTest } from '../src/nativeMouthTest/scene.js';
const manifest = JSON.parse(fs.readFileSync(new URL('../public/audio/native-mouth-test/generated/dialogue.json', import.meta.url)));

test('native visemes preserve closure and evaluate independently of seek direction', () => {
  const cues = [{ start: 0, end: .2, value: 'D' }, { start: .2, end: .3, value: 'A' }, { start: .3, end: .5, value: 'F' }];
  assert.equal(visemeAt(cues, .24).open, 0);
  assert.equal(visemeAt(cues, .6).shape, 'X');
  assert.equal(visemeAt(manifest.lines[0].cues, 4.2).shape, 'X');
  const expected = visemeAt(cues, .31); visemeAt(cues, .49);
  assert.deepEqual(visemeAt(cues, .31), expected);
  for (const line of manifest.lines) for (let t = 0; t <= line.duration; t += 1/60) {
    const state = visemeAt(line.cues, t);
    assert.ok(state.open >= 0 && state.open <= 1);
    assert.ok(Math.abs(Object.values(state.weights).reduce((a, b) => a + b, 0) - 1) < 1e-8);
  }
});
test('opt-in mouth retains fixed attachments, bounded surfaces and concealed closed-mouth teeth', () => {
  for (const character of ['balu', 'rabbit']) {
    const rig = createCharacterRig(character), mouth = createNativeMouth(rig);
    const anchor = mouth.group.position.toArray();
    assert.equal(mouth.group.parent, rig.visual.headGroup);
    for (const shape of Object.keys(VISEMES)) for (const emotion of ['neutral', 'friendly', 'worried']) {
      const state = mouth.update(visemeAt([{ start: 0, end: 1, value: shape }], .5), { emotion });
      assert.deepEqual(mouth.group.position.toArray(), anchor);
      assert.deepEqual(mouth.group.scale.toArray(), [1, 1, 1]);
      assert.ok(state.lipGap >= .001 && state.lipGap <= mouth.contract.opening + .002);
      if (shape === 'A' || shape === 'X') { assert.equal(mouth.teeth.visible, false); assert.equal(mouth.tongue.visible, false); }
      for (const mesh of mouth.surfaces) {
        assert.ok(mesh.morphTargetInfluences.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
        for (const attr of [mesh.geometry.attributes.position, ...mesh.geometry.morphAttributes.position, ...mesh.geometry.morphAttributes.normal]) assert.ok(Array.from(attr.array).every(Number.isFinite));
      }
    }
    mouth.dispose(); assert.equal(mouth.group.parent, null);
  }
});
test('bear teeth taper toward small tips while rabbit front incisors retain their anatomy', () => {
  for (const character of ['balu', 'rabbit']) {
    const mouth = createNativeMouth(createCharacterRig(character));
    const teeth = mouth.teeth.children;
    assert.equal(teeth.length, character === 'balu' ? 6 : 2);
    const positions = teeth[0].geometry.attributes.position;
    const upper = [], lower = [];
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      assert.ok([x, y, z].every(Number.isFinite));
      if (y > mouth.contract.teeth.size[1] * .3) upper.push(x);
      if (y < -mouth.contract.teeth.size[1] * .3) lower.push(x);
    }
    const width = values => Math.max(...values) - Math.min(...values);
    if (character === 'balu') assert.ok(width(lower) < width(upper) * .6);
    else assert.equal(width(lower), width(upper));
    const anatomy = JSON.stringify(teeth.map(tooth => [tooth.position.toArray(), tooth.scale.toArray()]));
    for (const shape of Object.keys(VISEMES)) {
      mouth.update(visemeAt([{ start: 0, end: 1, value: shape }], .5));
      assert.equal(JSON.stringify(teeth.map(tooth => [tooth.position.toArray(), tooth.scale.toArray()])), anatomy);
    }
    mouth.dispose();
  }
});
test('real dialogue scene retains head attachment and identical poses through cuts and reverse seeking', () => {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera();
  const world = createNativeMouthTest({ scene, camera, manifest });
  const snapshot = () => JSON.stringify(Object.values(world.actors).map(actor => ({
    visible: actor.rig.root.visible, head: actor.rig.joints.head.node.rotation.toArray(),
    weights: actor.mouth.surfaces[0].morphTargetInfluences, camera: camera.position.toArray()
  })));
  for (const line of manifest.lines) for (const t of [.0, .6, 1.3, 2.6, line.duration]) {
    world.update(line.start + t, { autoView: true }); const expected = snapshot();
    world.update(manifest.duration); world.update(line.start + t, { autoView: true });
    assert.equal(snapshot(), expected);
    const actor = world.actors[line.character];
    assert.equal(actor.mouth.group.parent, actor.rig.visual.headGroup);
    assert.ok(camera.position.toArray().every(Number.isFinite));
  }
  assert.ok(Math.abs(world.config.shots.at(-1).end - manifest.duration) < 1e-8);
});
test('export and diagnostic angles retain full head and ears throughout real recordings', () => {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1920/1080);
  const world = createNativeMouthTest({ scene, camera, manifest });
  const point = new THREE.Vector3(), delta = new THREE.Vector3();
  for (const aspect of [1920/1080, .64, 9/16]) for (const line of manifest.lines) for (let time = 0; time <= line.duration; time += .1) for (const view of ['front','three','side']) {
    camera.aspect = aspect;
    world.update(time, { lineId: line.id, view });
    const head = world.actors[line.character].rig.visual.headGroup;
    head.traverse(mesh => {
      if (!mesh.isMesh) return;
      for (let node = mesh; node; node = node.parent) if (!node.visible) return;
      const positions = mesh.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i);
        mesh.geometry.morphAttributes.position?.forEach((target, index) => {
          point.addScaledVector(delta.fromBufferAttribute(target, i), mesh.morphTargetInfluences[index]);
        });
        point.applyMatrix4(mesh.matrixWorld).project(camera);
        assert.ok(Math.abs(point.x) < .98 && Math.abs(point.y) < .98, `${line.speaker} ${view} ${time}: ${point.toArray()}`);
      }
    });
  }
});
