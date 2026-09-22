import { EPISODES, resolveSelection } from '../episodes/catalog.js';
import { TIKTOK_VIDEOS } from '../tiktok/catalog.js';
import { resolveVideoFormat } from './videoFormat.js';

export function resolveContentSelection(params, videos = TIKTOK_VIDEOS) {
  if (params.get('collection') !== 'tiktok') {
    return { ...resolveSelection(params), collection: 'episodes', entries: EPISODES };
  }
  const episode = videos.find(video => video.id === params.get('video')) ?? videos.at(-1);
  const scene = episode?.scenes.find(scene => scene.id === params.get('scene')) ?? episode?.scenes[0];
  return { collection: 'tiktok', entries: videos, episode, scene, thumbnail: false };
}

export function contentFormat(selection, requested) {
  return resolveVideoFormat(selection.thumbnail ? 'landscape' : selection.collection === 'tiktok' ? 'vertical' : requested);
}

export function contentParams(collection, itemId, sceneId = '', format = 'landscape') {
  return new URLSearchParams(collection === 'tiktok'
    ? { collection, video: itemId, scene: sceneId, format: 'vertical' }
    : { episode: itemId, scene: sceneId, format });
}
