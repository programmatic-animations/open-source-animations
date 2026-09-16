import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createHoneyBetrayalScene, SCENE_CONFIG } from '../src/scenes/honeyBetrayal.js';

// Texture loading is the only DOM dependency; test actual scene geometry and poses.
THREE.TextureLoader.prototype.load = () => new THREE.Texture();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
const { update } = createHoneyBetrayalScene({ scene, camera });
function snapshot(t) {
  update(t); scene.updateMatrixWorld(true);
  const values = [];
  scene.traverse(o => values.push([o.visible, ...o.matrixWorld.elements]));
  values.push([...camera.position, ...camera.quaternion, camera.fov]);
  return values;
}
test('every frame has finite transforms', () => {
  for (let f = 0; f <= SCENE_CONFIG.duration * 60; f++) {
    for (const values of snapshot(f / 60)) assert.ok(values.every(v => typeof v === 'boolean' || Number.isFinite(v)));
  }
});
test('scrubbing backward produces the same poses as forward playback', () => {
  const times = [0, 2.5, 5, 8, 11.5, 15, 21, 28.5, 31.7, 32.7, 36, 41, 43, 47];
  const expected = times.map(snapshot);
  for (let i = times.length - 1; i >= 0; i--) assert.deepEqual(snapshot(times[i]), expected[i]);
});
test('bear climbs, falls; rabbits retain honey and ladder lands in pit', () => {
  const bear = scene.getObjectByName('story-bear');
  const honey = scene.getObjectByName('story-honey');
  update(18); const bottom = bear.position.y;
  update(23); assert.ok(bear.position.y > bottom + 3);
  update(34); const retainedHoney = honey.position.clone();
  update(42); assert.ok(bear.position.y < -3);
  assert.ok(honey.position.distanceTo(retainedHoney) < 1e-8);
  for (let k = 0; k < 15; k++) assert.ok(scene.getObjectByName(`ladder-rung-${k}`).position.y < -3);
  assert.deepEqual(snapshot(47), snapshot(60));
});

test('inserted reaction changes the bear eyeline before the comb transfers', () => {
  const bear = scene.getObjectByName('story-bear');
  const head = bear.children.find(o => o.isGroup && o.position.y > 1.6);
  const honey = scene.getObjectByName('story-honey');
  update(27.5); const gazeAtRabbit = head.rotation.x;
  update(29); assert.ok(head.rotation.x > gazeAtRabbit + 0.2);
  assert.ok(honey.position.y < 2);
  update(33.5); assert.ok(honey.position.y > 2.3);
});
