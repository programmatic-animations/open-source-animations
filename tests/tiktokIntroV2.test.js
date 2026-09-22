import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createIntroV2Scene, SCENE_CONFIG } from '../src/tiktok/introV2/scene.js';
import { DURATION } from '../src/tiktok/intro/timing.js';
import { applyVideoFraming, resolveVideoFormat } from '../src/runtime/videoFormat.js';
import { getShotAt } from '../src/runtime/shotTimeline.js';
import { resolveContentSelection } from '../src/runtime/contentSelection.js';

test('V2 preserves V1, audio offset, duration and clean editing handles', () => {
  assert.equal(resolveContentSelection(new URLSearchParams('collection=tiktok&video=tiktok-intro')).scene.id, 'tiktok-intro-main');
  assert.equal(resolveContentSelection(new URLSearchParams('collection=tiktok&video=tiktok-intro&scene=tiktok-intro-v2')).scene.id, SCENE_CONFIG.id);
  assert.ok(Math.abs(SCENE_CONFIG.shots.at(-1).end - DURATION) < 1e-10);
  const { update, graphics, effects } = createIntroV2Scene({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera() });
  for (const time of [0, 1.99, DURATION - 1.99, DURATION]) {
    update(time);
    assert.ok(graphics.entries.every(entry => !entry.mesh.visible));
    assert.equal(effects.wire.visible, false);
    assert.equal(effects.cape.visible, false);
  }
});

test('V2 muzzle remains clear of all scene geometry and captions at every frame', () => {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 9/16, .1, 100);
  const { update, actors, graphics, effects } = createIntroV2Scene({ scene, camera });
  const hudMeshes = new Set(graphics.entries.map(e => e.mesh));
  const headMeshes = new Set(); actors.headGroup.traverse(node => headMeshes.add(node));
  const meshes = []; scene.traverse(node => { if (node.isMesh && !headMeshes.has(node) && !hudMeshes.has(node)) meshes.push(node); });
  const ray = new THREE.Raycaster();
  for (let frame = 0; frame <= Math.ceil(DURATION * 60); frame++) {
    const time = Math.min(DURATION, frame / 60);
    update(time); applyVideoFraming(camera, resolveVideoFormat('vertical'), getShotAt(SCENE_CONFIG.shots, time).shot);
    scene.updateMatrixWorld(true);
    actors.bear.traverse(node => assert.ok(node.matrixWorld.elements.every(Number.isFinite)));
    // Grid covering the overlay's lower muzzle region, rather than only its center.
    for (const x of [-.18, 0, .18]) for (const y of [-.31, -.18]) {
      const target = actors.headGroup.localToWorld(new THREE.Vector3(x, y, .65));
      const projected = target.clone().project(camera);
      assert.ok(Math.abs(projected.x) < .78 && Math.abs(projected.y) < .62, 'muzzle in safe central frame');
      const distance = target.distanceTo(camera.position);
      ray.set(camera.position, target.clone().sub(camera.position).normalize());
      assert.ok(!ray.intersectObjects(meshes.filter(m => m.visible), false).some(hit => hit.distance < distance - .01),
        'geometry occlusion at ' + time);
      for (const entry of graphics.entries.filter(e => e.mesh.visible)) {
        const center = entry.mesh.getWorldPosition(new THREE.Vector3()).project(camera);
        const height = .2 * entry.mesh.scale.y / (.8 * Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
        assert.ok(Math.abs(projected.y - center.y) > height / 2 + .025, 'text overlaps muzzle at ' + time);
      }
    }
  }
  const state = t => {
    update(t);
    return JSON.stringify({
      actor: actors.bear.matrixWorld.elements,
      head: actors.headGroup.matrixWorld.elements,
      brow: actors.brows.map(b => b.matrixWorld.elements),
      cape: Array.from(effects.cape.geometry.attributes.position.array),
      text: graphics.entries.map(e => [e.mesh.visible, e.mesh.position.toArray(), e.mesh.scale.toArray()])
    });
  };
  const original = state(14.2); state(32.8); assert.equal(state(14.2), original);
});
