import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createTheBearScene, SCENE_CONFIG } from '../src/tiktok/theBear/sceneV4.js';
import { SHOTS } from '../src/tiktok/theBear/shotsV4.js';
import { SCENE_CONFIG as V3 } from '../src/tiktok/theBear/sceneV3.js';
import { HONEY_BETRAYAL_SHOTS } from '../src/shots/honeyBetrayalShots.js';
import { applyVideoFraming, resolveVideoFormat } from '../src/runtime/videoFormat.js';

THREE.TextureLoader.prototype.load = () => new THREE.Texture();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(43, 9 / 16, 0.1, 1000);
const cut = createTheBearScene({ scene, camera });
const at = (id, p = 0) => {
  const shot = SHOTS.find(s => s.id === id);
  assert.ok(shot, id);
  return shot.start + p * shot.duration;
};
const position = object => object.getWorldPosition(new THREE.Vector3());

test('V4 preserves V3 and tells the full story without freezing the escape', () => {
  assert.equal(V3.duration, 111.7);
  assert.equal(SCENE_CONFIG.duration, 117.55);
  assert.deepEqual(SHOTS.slice(0, 8).map(s => s.id), [
    'honey-hook', 'scent', 'decision', 'climb-tree', 'branch-approach', 'break', 'landing', 'wake'
  ]);
  const deal = SHOTS.filter(s => s.world === 'deal');
  assert.equal(deal[0].from, HONEY_BETRAYAL_SHOTS[0].start);
  assert.equal(deal.at(-1).to, HONEY_BETRAYAL_SHOTS.at(-1).end);
  for (let i = 1; i < deal.length; i++) assert.equal(deal[i - 1].to, deal[i].from);
  const reaction = SHOTS.find(s => s.id === 'revenge-three-reaction');
  assert.ok(reaction.to - reaction.from > 1);
});

test('V4 is finite and reversible, including lights and prop positions', () => {
  const times = SHOTS.flatMap(s => [s.start, s.start + s.duration * 0.5, s.end - 0.001]);
  const snapshot = time => {
    cut.update(time);
    scene.updateMatrixWorld(true);
    const world = Object.values(cut.worlds).find(w => w.root.visible);
    const values = [...camera.position, ...camera.quaternion, camera.fov];
    world.root.traverse(o => {
      values.push(o.visible ? 1 : 0, ...o.position, ...o.quaternion, ...o.scale);
      if (o.isLight) values.push(o.intensity);
    });
    assert.ok(values.every(Number.isFinite), `non-finite pose at ${time}`);
    return values;
  };
  const forward = times.map(snapshot);
  for (let i = times.length - 1; i >= 0; i--) assert.deepEqual(snapshot(times[i]), forward[i], `t=${times[i]}`);
});

test('the branch falls, the reconstructed pit has a supported floor, and Balu keeps his proportions', () => {
  cut.update(at('honey-hook'));
  const initialHoneyY = position(cut.worlds.trap.actors.honey).y;
  cut.update(at('break', 0.95));
  assert.ok(position(cut.worlds.trap.actors.honey).y < initialHoneyY - 2);
  for (const id of ['branch-approach', 'break']) {
    cut.update(at(id, 0.8));
    assert.equal(cut.worlds.trap.actors.b.leftArm.scale.y, 1);
    assert.equal(cut.worlds.trap.actors.b.rightArm.scale.y, 1);
  }
  const pit = cut.worlds.pit;
  for (const id of ['landing', 'wake', 'reveal']) {
    cut.update(at(id, 0.7));
    const floor = pit.root.getObjectsByProperty('type', 'Mesh').find(o => o.geometry?.type === 'CircleGeometry');
    assert.ok(Math.abs(floor.position.y + 3.38) < 0.001);
    assert.ok(pit.actors.b.bear.position.y >= floor.position.y - 0.01);
    assert.equal(pit.actors.b.leftLeg.scale.y, 1);
    assert.equal(pit.actors.b.rightLeg.scale.y, 1);
  }
});

test('the original paw contacts and lifts the comb without a replacement limb or prop jump', () => {
  const { b, honey } = cut.worlds.deal.actors;
  const originalArmMesh = b.rightArm.children.find(child => child.isMesh);
  const samples = [];
  for (let t = 10; t <= 12.8; t += 0.05) {
    cut.update(at('deal-pickup') + t - 10);
    scene.updateMatrixWorld(true);
    const palm = b.rightArm.localToWorld(new THREE.Vector3(0, -0.7, 0));
    samples.push(honey.position.clone());
    assert.equal(originalArmMesh.visible, true);
    assert.equal(b.rightArm.scale.y, 1);
    assert.ok(honey.position.y >= -3.21, `honey below floor at ${t}`);
    if (t >= 11.55) assert.ok(Math.abs(palm.distanceTo(honey.position) - 0.16 * (1 - THREE.MathUtils.smoothstep(t, 11.55, 12.82))) < 0.03);
  }
  for (let i = 1; i < samples.length; i++) assert.ok(samples[i].distanceTo(samples[i - 1]) < 0.11, `honey jump at sample ${i}`);
});

test('the hesitation camera sees Balu react to the offered paw', () => {
  for (const progress of [0.1, 0.5, 0.95]) {
    cut.update(at('deal-choice-face', progress));
    scene.updateMatrixWorld(true);
    const head = cut.worlds.deal.actors.b.headGroup;
    const face = new THREE.Vector3(0, 0, 1).applyQuaternion(head.getWorldQuaternion(new THREE.Quaternion()));
    const toCamera = camera.position.clone().sub(position(head)).normalize();
    assert.ok(face.dot(toCamera) > 0.48, `camera behind Balu at ${progress}`);
  }
});

test('the fallen ladder remains present and all three survivors flee in frame', () => {
  cut.update(at('revenge-you-next', 0.8));
  const revenge = cut.worlds.revenge;
  const rungs = revenge.root.children.filter(o => o.name.startsWith('ladder-rung-'));
  assert.ok(rungs.length > 0 && rungs.every(o => o.visible));
  const escape = SHOTS.find(s => s.id === 'revenge-scatter');
  for (const progress of [0, 0.3, 0.6, 0.98]) {
    cut.update(at('revenge-scatter', progress));
    applyVideoFraming(camera, resolveVideoFormat('vertical'), escape);
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    for (const rabbit of revenge.actors.rabbits.slice(1)) {
      const projected = position(rabbit.headGroup).project(camera);
      assert.ok(Math.abs(projected.x) < 0.92 && Math.abs(projected.y) < 0.92, `rabbit outside frame at ${progress}`);
    }
    assert.ok(revenge.root.getObjectByName('horror-forest').children.every(tree => tree.visible));
  }
  cut.update(escape.end - 0.001);
  const last = revenge.actors.rabbits.slice(1).map(r => r.rabbit.position.clone());
  cut.update(at('revenge-smile'));
  revenge.actors.rabbits.slice(1).forEach((r, i) => assert.ok(r.rabbit.position.distanceTo(last[i]) < 0.15));
});
