import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { resolveVideoFormat, fitVideoPreview, applyVideoFraming, videoFilename } from '../src/runtime/videoFormat.js';

test('formats fall back safely and keep separate export names', () => {
  assert.equal(resolveVideoFormat('unknown').id, 'landscape');
  assert.equal(videoFilename('honey-betrayal', resolveVideoFormat()), 'honey-betrayal');
  assert.equal(videoFilename('honey-betrayal', resolveVideoFormat('vertical')), 'honey-betrayal-vertical');
});

test('portrait preserves horizontal composition without accumulating zoom', () => {
  const camera = new THREE.PerspectiveCamera(53, 16 / 9, 0.1, 1000);
  const point = new THREE.Vector3(1, 0, -5);
  const original = point.clone().project(camera).x;
  const vertical = resolveVideoFormat('vertical');
  for (let i = 0; i < 20; i++) applyVideoFraming(camera, vertical);
  assert.ok(Math.abs(point.clone().project(camera).x - original) < 1e-12);
  applyVideoFraming(camera, vertical, { verticalZoom: 1.2 });
  assert.ok(Math.abs(point.clone().project(camera).x - original * 1.2) < 1e-12);
  applyVideoFraming(camera, resolveVideoFormat());
  assert.equal(camera.zoom, 1);
  assert.ok(Math.abs(point.clone().project(camera).x - original) < 1e-12);
});

test('preview fits either orientation without stretching', () => {
  for (const id of ['landscape', 'vertical']) {
    const format = resolveVideoFormat(id);
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const size = fitVideoPreview(w, h, format);
      assert.ok(size.width <= w && size.height <= h);
      assert.ok(Math.abs(size.width / size.height - format.width / format.height) < 1e-12);
    }
  }
});
