import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createDeathToRabbitsScene, SCENE_CONFIG } from '../src/scenes/deathToRabbits.js';
import { createHoneyBetrayalScene } from '../src/scenes/honeyBetrayal.js';
import { resolveSelection } from '../src/episodes/catalog.js';
THREE.TextureLoader.prototype.load = () => new THREE.Texture();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
const { update, actors } = createDeathToRabbitsScene({ scene, camera });
function snapshot(t) {
  update(t); scene.updateMatrixWorld(true);
  const values = [];
  scene.traverse(o => values.push([o.visible, ...o.matrixWorld.elements, ...(o.isLight ? [o.intensity, ...o.color] : [])]));
  values.push([...camera.position, ...camera.quaternion, camera.fov, ...scene.background]);
  return values;
}
test('Episode 3 opens on the approved final pose and camera for two seconds', () => {
  const priorScene = new THREE.Scene(), priorCamera = camera.clone();
  const prior = createHoneyBetrayalScene({ scene: priorScene, camera: priorCamera }); prior.update(47);
  for (const t of [0, 1, 1.999]) {
    update(t);
    for (const key of ['bear', 'headGroup', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg']) {
      assert.deepEqual(actors.b[key].position.toArray(), prior.actors.b[key].position.toArray());
      assert.deepEqual(actors.b[key].quaternion.toArray(), prior.actors.b[key].quaternion.toArray());
    }
    assert.deepEqual(camera.position.toArray(), priorCamera.position.toArray());
    assert.deepEqual(camera.quaternion.toArray(), priorCamera.quaternion.toArray());
    assert.equal(camera.fov, priorCamera.fov);
  }
});
test('all horror frames have finite transforms', () => {
  for (let frame = 0; frame <= SCENE_CONFIG.duration * 60; frame++) {
    for (const row of snapshot(frame / 60)) assert.ok(row.every(v => typeof v === 'boolean' || Number.isFinite(v)));
  }
});
test('transformation, severing, blood and lighting scrub reversibly', () => {
  const times = [0, 2.01, 4, 6, 7.2, 9, 11.5, 13, 16, 19.6, 20.25, 20.8, 22, 24, 27, 30, 17.8, 18.8, 34, 35, 36.5, 38.4, 39.2, 44.4, 47];
  const expected = times.map(snapshot);
  for (let i = times.length - 1; i >= 0; i--) assert.deepEqual(snapshot(times[i]), expected[i], `time ${times[i]}`);
  assert.deepEqual(snapshot(100), snapshot(SCENE_CONFIG.duration));
});
test('hands emerge, the spear reaches the face, the body retains honey and smile waits', () => {
  update(5); assert.ok(actors.hands.every(h => !h.hand.visible));
  update(6); assert.ok(actors.hands.every(h => h.hand.visible && h.fingers.every(f => !f.visible)));
  update(9); assert.ok(actors.hands.every(h => h.hand.visible && h.fingers.length === 5));
  update(22.25);
  const tip = new THREE.Vector3(0, 0.85, 0).applyQuaternion(actors.branch.quaternion).add(actors.branch.position);
  const face = actors.rabbits[0].headGroup.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -0.05, 0.34));
  assert.ok(tip.distanceTo(face) < 1e-8);
  for (const t of [24, 26, 44]) {
    update(t);
    const expectedHoney = actors.rabbits[0].rabbit.localToWorld(new THREE.Vector3(0, 0.73, 0.42));
    assert.ok(actors.honey.position.distanceTo(expectedHoney) < 1e-8);
  }
  assert.ok(actors.rabbits[0].rabbit.position.y < -3);
  assert.equal(actors.rabbits[0].headGroup.visible, false);
  update(40.9); assert.equal(actors.smile.visible, false);
  update(44); assert.equal(actors.smile.visible, true);
});
test('Episode 3 thumbnail requests resolve to its dedicated poster', () => {
  const selection = resolveSelection(new URLSearchParams('episode=ep3&scene=thumbnail'));
  assert.equal(selection.scene.id, 'bear-ep3-thumbnail'); assert.equal(selection.thumbnail, true);
});

test('rotating pickup keeps the entire branch above the pit floor', () => {
  const vertex = new THREE.Vector3();
  const positions = actors.branch.geometry.attributes.position;
  for (let frame = 10 * 120; frame <= 14 * 120; frame++) {
    update(frame / 120);
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i).applyMatrix4(actors.branch.matrixWorld);
      assert.ok(vertex.y >= -3.38, `branch below floor at ${frame / 120}`);
    }
  }
});
test('skepticism precedes fear, then three survivors scatter after the point', () => {
  update(18);
  for (let i = 0; i < 4; i++) {
    const r = actors.rabbits[i], brows = actors.rabbitActing[i].brows;
    assert.ok(brows[0].position.y > brows[1].position.y + 0.07);
    assert.ok(r.mouth.scale.y < 0.1);
  }
  update(34.5); const starts = actors.rabbits.slice(1).map(r => r.rabbit.position.clone());
  assert.ok(actors.rabbits.slice(1).every(r => r.mouth.scale.y > 1.5));
  update(38.5);
  actors.rabbits.slice(1).forEach((r, i) => {
    assert.ok(r.rabbit.position.distanceTo(starts[i]) > 20);
    assert.ok(r.rabbit.position.z < starts[i].z - 18);
  });
  assert.ok(actors.rabbits[2].rabbit.position.x < -10);
  assert.ok(actors.rabbits[3].rabbit.position.x > 10);
});
