import test from 'node:test';
import assert from 'node:assert/strict';
import { poseAt, SHAPES } from '../src/speech/cues.js';
import { createMouth } from '../src/speech/mouth.js';
test('speech is deterministic under seeking and rests outside cues', () => {
  const cues = [{ start: 0.1, end: 0.4, value: 'D' }, { start: 0.4, end: 0.8, value: 'F' }];
  assert.deepEqual(poseAt(cues, 0), SHAPES.X);
  assert.deepEqual(poseAt(cues, 0.3), SHAPES.D);
  const first = poseAt(cues, 0.43); poseAt(cues, 0.7); assert.deepEqual(poseAt(cues, 0.43), first);
  assert.deepEqual(poseAt(cues, 0.9), SHAPES.X);
  assert.ok(first[0] > SHAPES.F[0] && first[0] < SHAPES.D[0]);
});
test('all mouth shapes have finite geometry and remain inside export camera', () => {
  const mouth = createMouth();
  for (const pose of Object.values(SHAPES)) { mouth.update(pose); mouth.group.traverse(o => { assert.ok([...o.position, ...o.scale].every(Number.isFinite)); assert.ok(o.scale.x <= 1.5); }); }
});
