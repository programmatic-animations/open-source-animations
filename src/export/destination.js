// Shared by browser and server. Never accept a client-provided filesystem path.
export function exportDestination(collection = 'episodes', sceneId = 'scene') {
  if (!['episodes', 'tiktok'].includes(collection)) throw new Error('Unknown video collection');
  const id = String(sceneId).toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'scene';
  return collection === 'tiktok' ? `tiktok/${id}.mp4` : `${id}.mp4`;
}
