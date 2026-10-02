import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createTheBearScene, SCENE_CONFIG } from '../src/tiktok/theBear/scene.js';
import { SCENE_CONFIG as V4 } from '../src/tiktok/theBear/sceneV4.js';
import { SHOTS } from '../src/tiktok/theBear/shots.js';
import { applyVideoFraming, resolveVideoFormat } from '../src/runtime/videoFormat.js';

THREE.TextureLoader.prototype.load = () => new THREE.Texture();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(43, 9 / 16, 0.1, 1000);
const cut = createTheBearScene({ scene, camera });
const shot = id => SHOTS.find(s => s.id === id);
const time = (id, p = 0) => shot(id).start + shot(id).duration * p;
const pos = object => object.getWorldPosition(new THREE.Vector3());

test('V5 preserves V4 and all causal story beats', () => {
  assert.equal(V4.duration, 117.55);
  assert.equal(SCENE_CONFIG.duration, 114.65);
  assert.equal(SHOTS.length, 44);
  assert.deepEqual(SHOTS.slice(0, 5).map(s => s.id), [
    'honey-hook', 'scent', 'approach', 'decision', 'climb-tree'
  ]);
  const deal = SHOTS.filter(s => s.world === 'deal');
  assert.equal(deal[0].from, 0);
  assert.equal(deal.at(-1).to, 47);
  for (let i = 1; i < deal.length; i++) assert.equal(deal[i - 1].to, deal[i].from);
  assert.ok(SHOTS.findIndex(s => s.id === 'deal-choice-hands') < SHOTS.findIndex(s => s.id === 'deal-betrayal'));
  assert.ok(SHOTS.findIndex(s => s.id === 'revenge-you-next') < SHOTS.findIndex(s => s.id === 'revenge-scatter'));
  assert.ok(shot('revenge-three-reaction').duration > shot('revenge-scatter').duration);
  assert.equal(shot('revenge-three-reaction').to, shot('revenge-scatter').from);
  assert.ok((shot('revenge-scatter').to - shot('revenge-scatter').from) / shot('revenge-scatter').duration >= 1.3);
});

test('the new cut is finite and reversible through all shots', () => {
  const times = SHOTS.flatMap(s => [s.start, s.start + s.duration / 2, s.end - 0.001]);
  const snapshot = t => {
    cut.update(t); scene.updateMatrixWorld(true);
    const world = Object.values(cut.worlds).find(w => w.root.visible);
    const values = [...camera.position, ...camera.quaternion, camera.fov];
    world.root.traverse(o => {
      values.push(o.visible ? 1 : 0, ...o.position, ...o.quaternion, ...o.scale);
      if (o.isLight) values.push(o.intensity);
    });
    assert.ok(values.every(Number.isFinite), `non-finite pose at ${t}`);
    return values;
  };
  const forward = times.map(snapshot);
  for (let i = times.length - 1; i >= 0; i--) assert.deepEqual(snapshot(times[i]), forward[i], `t=${times[i]}`);
});

test('Balu walks near the floor and climbs with fixed proportions and trunk contact', () => {
  const b = cut.worlds.trap.actors.b;
  for (let t = 2.1; t <= 3.9; t += 0.1) {
    cut.update(time('approach') + t - 2);
    scene.updateMatrixWorld(true);
    const feet = [b.leftLeg, b.rightLeg].map(leg => leg.localToWorld(new THREE.Vector3(0, -0.325, 0)).y);
    assert.ok(Math.min(...feet) > -0.025 && Math.min(...feet) < 0.1, `walk foot contact at ${t}`);
  }
  for (let t = 7.9; t <= 10.7; t += 0.05) {
    cut.update(time('climb-tree') + t - 7.5);
    scene.updateMatrixWorld(true);
    const body = b.bear.children.find(o => o.isMesh && o.geometry?.type === 'SphereGeometry');
    const center = pos(body);
    const trunkRadius = y => 0.6 - 0.15 * THREE.MathUtils.clamp(y / 4, 0, 1);
    assert.ok(center.z - 0.65 * 0.75 - trunkRadius(center.y) > 0.015, `body enters trunk at ${t}`);
    for (const arm of [b.leftArm, b.rightArm]) {
      const palm = arm.localToWorld(new THREE.Vector3(0, -0.7, 0));
      const gap = Math.hypot(palm.x, palm.z) - trunkRadius(palm.y);
      assert.ok(Math.abs(gap) < 0.03, `paw misses trunk at ${t}: ${gap}`);
      assert.equal(arm.scale.y, 1);
    }
  }
});

test('the sit-up keeps bees off Balu’s face and the new views retain their subjects', () => {
  for (const t of [1.1, 1.5, 2, 2.6]) {
    cut.update(time('brace') + t - 1);
    scene.updateMatrixWorld(true);
    const { b, bees } = cut.worlds.pit.actors;
    for (const bee of bees) assert.ok(pos(bee).distanceTo(pos(b.headGroup)) > 0.7, `bee blocks face at ${t}`);
  }
  for (const id of ['approach', 'decision', 'climb-tree', 'brace', 'look-up', 'deal-their-price', 'deal-climb-hope']) {
    for (const p of [0.1, 0.5, 0.9]) {
      cut.update(time(id, p));
      applyVideoFraming(camera, resolveVideoFormat('vertical'), shot(id));
      scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
      const world = cut.worlds[shot(id).world];
      const subject = id === 'deal-their-price' ? world.actors.rabbits[0].headGroup : world.actors.b.headGroup;
      const projected = pos(subject).project(camera);
      assert.ok(Math.abs(projected.x) < 0.92 && Math.abs(projected.y) < 0.92, `${id} loses subject at ${p}`);
    }
  }
});

test('all three fleeing rabbits stay readable in the fast portrait escape', () => {
  const escape = shot('revenge-scatter');
  for (const p of [0.1, 0.35, 0.6, 0.85, 0.98]) {
    cut.update(time('revenge-scatter', p));
    applyVideoFraming(camera, resolveVideoFormat('vertical'), escape);
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    for (const rabbit of cut.worlds.revenge.actors.rabbits.slice(1)) {
      const head = pos(rabbit.headGroup).project(camera);
      const foot = rabbit.rabbit.localToWorld(new THREE.Vector3(0, 0, 0)).project(camera);
      assert.ok(Math.abs(head.x) < 0.95 && Math.abs(head.y) < 0.9, `rabbit leaves frame at ${p}`);
      assert.ok(Math.abs(head.y - foot.y) > 0.06, `rabbit becomes too small at ${p}`);
    }
  }
});
