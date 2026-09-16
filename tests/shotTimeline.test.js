import test from 'node:test';
import assert from 'node:assert/strict';
import { defineShots, getShotAt, updateShot } from '../src/runtime/shotTimeline.js';
import { EPISODES, resolveSelection } from '../src/episodes/catalog.js';
test('shot cuts and endpoint clamping use local time', () => {
  const shots=defineShots([{id:'a',duration:2},{id:'b',duration:3}]);
  assert.equal(getShotAt(shots,2).shot.id,'b');
  assert.equal(getShotAt(shots,-10).time,0);
  assert.equal(getShotAt(shots,99).time,3);
  assert.throws(()=>defineShots([{id:'a',duration:0}]));
  assert.throws(()=>defineShots([{id:'a',duration:1},{id:'a',duration:1}]));
  let time;updateShot(defineShots([{id:'local',duration:3,update:c=>time=c.shotTime}]),2,{});assert.equal(time,2);
});
test('every episode scene has shots covering its complete duration', () => {
  for(const episode of EPISODES){
    assert.equal(new Set(episode.scenes.map(s=>s.id)).size,episode.scenes.length);
    for(const scene of episode.scenes){assert.equal(scene.shots[0].start,0);assert.equal(scene.shots.at(-1).end,scene.duration);assert.equal(typeof scene.create,'function');}
  }
  assert.equal(resolveSelection(new URLSearchParams()).episode.id,'ep2');
  assert.equal(resolveSelection(new URLSearchParams('episode=ep1')).scene.id,'bear-honey-trap');
  assert.equal(resolveSelection(new URLSearchParams('episode=ep2&scene=thumbnail')).scene.id,'bear-ep2-thumbnail');
});
