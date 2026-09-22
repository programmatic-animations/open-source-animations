import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createIntroScene, SCENE_CONFIG } from '../src/tiktok/intro/scene.js';
import { DURATION, LEAD_IN, DIALOGUE_DURATION, speechEnergy, phraseActing } from '../src/tiktok/intro/timing.js';
import { applyVideoFraming, resolveVideoFormat } from '../src/runtime/videoFormat.js';
import { getShotAt } from '../src/runtime/shotTimeline.js';
import { resolveContentSelection } from '../src/runtime/contentSelection.js';

test('intro has two-second handles, portrait registration and full shot coverage', () => {
  assert.equal(LEAD_IN, 2);
  assert.equal(DURATION - DIALOGUE_DURATION, 4);
  assert.equal(SCENE_CONFIG.shots.at(-1).end, DURATION);
  assert.equal(resolveContentSelection(new URLSearchParams('collection=tiktok&video=tiktok-intro')).scene.id, 'tiktok-intro-main');
  for (const time of [0, 1.9, DURATION - 1.5, DURATION]) {
    assert.equal(speechEnergy(time), 0);
    assert.deepEqual(phraseActing(time), { left: 0, right: 0, nod: 0, lean: 0 });
  }
});

test('every frame preserves clear muzzle, finite transforms and portrait framing', () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 9/16, .1, 100);
  const { update, actors } = createIntroScene({ scene, camera });
  const occluders = [];
  actors.bear.traverse(node => {
    if (node.isMesh && !actors.headGroup.children.includes(node)) occluders.push(node);
  });
  const ray = new THREE.Raycaster();
  for (let frame = 0; frame <= Math.ceil(DURATION * 60); frame++) {
    const time = Math.min(DURATION, frame / 60);
    update(time);
    applyVideoFraming(camera, resolveVideoFormat('vertical'), getShotAt(SCENE_CONFIG.shots, time).shot);
    actors.bear.traverse(node => assert.ok(node.matrixWorld.elements.every(Number.isFinite)));
    for (const x of [-.18, 0, .18]) {
      const target = actors.headGroup.localToWorld(new THREE.Vector3(x, -.23, .65));
      const projected = target.clone().project(camera);
      assert.ok(Math.abs(projected.x) < .82 && Math.abs(projected.y) < .82, 'muzzle stays inside frame');
      const distance = target.distanceTo(camera.position);
      ray.set(camera.position, target.clone().sub(camera.position).normalize());
      const hits = ray.intersectObjects(occluders, false);
      assert.ok(!hits.some(hit => hit.distance < distance - .015), 'paws/body never cover muzzle');
    }
  }
  update(9);
  const pose = actors.headGroup.matrixWorld.elements.slice();
  update(31); update(9);
  assert.deepEqual(actors.headGroup.matrixWorld.elements, pose);
});

test('dialogue drives different eye expressions and seeking restores them', () => {
  const { update, actors } = createIntroScene({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera() });
  const expression = t => { update(t); return actors.brows.map(b => [b.position.y, b.rotation.z]).flat().concat(actors.eyes.map(e => e.scale.y)); };
  const attention = expression(4.1), question = expression(12), hero = expression(22), farewell = expression(32.5);
  assert.notDeepEqual(attention, question);
  assert.notDeepEqual(question, hero);
  assert.notDeepEqual(hero, farewell);
  assert.deepEqual(expression(4.1), attention);
});
