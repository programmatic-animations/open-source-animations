import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createTheBearScene, SCENE_CONFIG } from '../src/tiktok/theBear/sceneV3.js';
import { SHOTS } from '../src/tiktok/theBear/shotsV3.js';
import { HONEY_BETRAYAL_SHOTS } from '../src/shots/honeyBetrayalShots.js';
import { applyVideoFraming, resolveVideoFormat } from '../src/runtime/videoFormat.js';

THREE.TextureLoader.prototype.load = () => new THREE.Texture();
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(43, 9 / 16, 0.1, 1000);
const cut = createTheBearScene({ scene, camera });
const portrait = resolveVideoFormat('vertical');
const at = (id, p = 0) => { const s = SHOTS.find(x => x.id === id); return s.start + p * s.duration; };
const pos = object => object.getWorldPosition(new THREE.Vector3());
function sample(t) {
  cut.update(t); scene.updateMatrixWorld(true);
  const values = [];
  for (const world of Object.values(cut.worlds)) if (world.root.visible) {
    world.root.traverse(o => values.push([o.visible, ...o.matrixWorld.elements]));
  }
  values.push([...camera.position, ...camera.quaternion, camera.fov]);
  return values;
}

test('V3 tells one ordered story, with the post-fall reaction removed', () => {
  assert.equal(SCENE_CONFIG.duration, 111.7);
  assert.deepEqual(SHOTS.map(s => s.world).filter((value, i, all) => i === 0 || value !== all[i - 1]), ['trap', 'pit', 'deal', 'revenge']);
  assert.equal(SHOTS[0].id, 'face-hook');
  assert.equal(SHOTS[1].id, 'branch-approach');
  assert.equal(SHOTS[2].id, 'break');
  assert.equal(SHOTS.find(s => s.id === 'wake').from, 2.6);
  assert.equal(SHOTS.some(s => s.id === 'revenge-horror'), false);
  assert.deepEqual(SHOTS.slice(-4).map(s => s.id), ['revenge-you-next', 'revenge-three-reaction', 'revenge-scatter', 'revenge-smile']);
  const deal = SHOTS.filter(s => s.world === 'deal');
  assert.equal(deal.length, HONEY_BETRAYAL_SHOTS.length);
  deal.forEach((shot, i) => assert.deepEqual([shot.from, shot.to], [HONEY_BETRAYAL_SHOTS[i].start, HONEY_BETRAYAL_SHOTS[i].end]));
});

test('all boundaries and interiors have finite, reversible transforms', () => {
  const times = SHOTS.flatMap(s => [s.start, s.start + s.duration * 0.5, s.end - 0.001]);
  const expected = times.map(sample);
  expected.flat(2).forEach(v => assert.ok(typeof v === 'boolean' || Number.isFinite(v)));
  for (let i = times.length - 1; i >= 0; i--) assert.deepEqual(sample(times[i]), expected[i], `t=${times[i]}`);
});

test('the pit opens on a seated bear with two bees that continue into the rabbit shot', () => {
  cut.update(at('wake')); scene.updateMatrixWorld(true);
  const { b, bees, rabbits } = cut.worlds.pit.actors;
  assert.equal(bees.length, 2);
  assert.ok(Math.abs(b.leftLeg.rotation.x + Math.PI / 2) < 1e-8);
  assert.ok(Math.abs(b.rightLeg.rotation.x + Math.PI / 2) < 1e-8);
  assert.ok(bees.every(bee => pos(bee).distanceTo(pos(b.headGroup)) < 1.1));
  assert.ok(rabbits.every(r => !r.rabbit.visible));
  const boundary = SHOTS.find(s => s.id === 'reveal').start;
  cut.update(boundary - 0.00001); const before = bees.map(pos);
  cut.update(boundary); const after = bees.map(pos);
  assert.ok(before.every((point, i) => point.distanceTo(after[i]) < 0.02));
});

test('the pickup has a reach, grip, lift, and grounded stones', () => {
  const { b, honey } = cut.worlds.deal.actors;
  const heights = [0.2, 0.5, 0.8].map(p => { cut.update(at('deal-pickup', p)); return pos(honey).y; });
  assert.ok(heights[0] < heights[2] - 0.3);
  cut.update(at('deal-pickup', 0.5));
  assert.ok(b.bear.children.some(o => o.type === 'Group' && o.visible && o.children.length === 4));
  cut.update(at('deal-never-again', 0.5));
  const bearForward = b.bear.getWorldDirection(new THREE.Vector3());
  const rabbitsDirection = pos(cut.worlds.deal.actors.rabbits[1].rabbit).sub(pos(b.bear)).normalize();
  bearForward.y = rabbitsDirection.y = 0;
  assert.ok(bearForward.normalize().dot(rabbitsDirection.normalize()) > 0.95);
  assert.ok(cut.worlds.deal.root.children.filter(o => o.geometry?.type === 'DodecahedronGeometry' && o.position.y > 0).every(o => !o.visible));
});

test('point, three-rabbit reaction, and escape remain readable in portrait', () => {
  cut.update(at('revenge-you-next', 0.8)); scene.updateMatrixWorld(true);
  const a = cut.worlds.revenge.actors;
  const index = a.hands[0].fingers[1];
  const base = pos(a.hands[0].hand);
  const tip = index.localToWorld(new THREE.Vector3(0, -0.29, 0));
  assert.ok(tip.clone().sub(base).normalize().dot(camera.position.clone().sub(base).normalize()) > 0.5);
  assert.ok(cut.worlds.revenge.root.children.filter(o => o.name.startsWith('ladder-rung-')).every(o => !o.visible));
  for (const id of ['revenge-three-reaction', 'revenge-scatter']) {
    const shot = SHOTS.find(s => s.id === id);
    for (const p of [0, 0.35, 0.7, 0.98]) {
      cut.update(at(id, p)); applyVideoFraming(camera, portrait, shot); scene.updateMatrixWorld(true);
      for (const r of a.rabbits.slice(1)) {
        const projected = pos(r.headGroup).project(camera);
        assert.ok(Math.abs(projected.x) < 0.9 && Math.abs(projected.y) < 0.9, `${id} ${p}: ${projected.x}, ${projected.y}`);
      }
    }
  }
});

test('the last two face beats push in, while the horror payoff remains', () => {
  for (const id of ['deal-never-again', 'revenge-smile']) {
    const w = cut.worlds[id.startsWith('deal') ? 'deal' : 'revenge'];
    cut.update(at(id, 0)); const start = camera.position.distanceTo(pos(w.actors.b.headGroup));
    cut.update(at(id, 0.99)); const end = camera.position.distanceTo(pos(w.actors.b.headGroup));
    assert.ok(end < start * 0.75, `${id}: ${start} -> ${end}`);
  }
  cut.update(at('revenge-impact', 0.5));
  let blood = 0;
  cut.worlds.revenge.root.traverse(o => { if (/^horror-blood/.test(o.name) && o.visible) blood++; });
  assert.ok(blood > 0);
  cut.update(at('revenge-smile', 0.6));
  assert.equal(cut.worlds.revenge.actors.smile.visible, true);
});
