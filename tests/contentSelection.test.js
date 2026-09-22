import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveContentSelection, contentFormat, contentParams } from '../src/runtime/contentSelection.js';
import { exportDestination } from '../src/export/destination.js';

test('TikTok is an isolated empty collection, never an episode fallback', () => {
  const selection = resolveContentSelection(new URLSearchParams('collection=tiktok&episode=ep3'), []);
  assert.equal(selection.scene, undefined);
  assert.equal(selection.entries.length, 0);
  assert.equal(contentFormat(selection, 'landscape').id, 'vertical');
  assert.equal(resolveContentSelection(new URLSearchParams()).episode.id, 'ep3');
});

test('TikTok navigation, stale links and formats stay inside the collection', () => {
  const videos = [{ id: 'tiktok-intro', scenes: [{ id: 'tiktok-intro-main' }] }];
  const params = contentParams('tiktok', 'tiktok-intro', 'tiktok-intro-main', 'landscape');
  const selection = resolveContentSelection(params, videos);
  assert.equal(selection.scene.id, 'tiktok-intro-main');
  assert.equal(params.get('format'), 'vertical');
  assert.equal(params.has('episode'), false);
  const stale = resolveContentSelection(new URLSearchParams('collection=tiktok&video=ep3&scene=thumbnail'), videos);
  assert.equal(stale.scene.id, 'tiktok-intro-main');
  assert.equal(stale.thumbnail, false);
  const episode = resolveContentSelection(new URLSearchParams('episode=ep2'));
  assert.equal(contentFormat(episode, 'vertical').id, 'vertical');
  assert.equal(contentFormat(episode).id, 'landscape');
});

test('export destinations separate collections and cannot escape exports', () => {
  assert.equal(exportDestination('episodes', 'honey-betrayal'), 'honey-betrayal.mp4');
  assert.equal(exportDestination('tiktok', 'tiktok-intro-vertical'), 'tiktok/tiktok-intro-vertical.mp4');
  assert.equal(exportDestination('tiktok', '../../intro'), 'tiktok/intro.mp4');
  assert.throws(() => exportDestination('../outside', 'intro'));
});
