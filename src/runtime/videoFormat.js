export const VIDEO_FORMATS = Object.freeze([
  Object.freeze({ id: 'landscape', label: 'Landscape · 1920 × 1080 (16:9)', width: 1920, height: 1080 }),
  Object.freeze({ id: 'vertical', label: 'TikTok · 1080 × 1920 (9:16)', width: 1080, height: 1920 })
]);

export function resolveVideoFormat(id) {
  return VIDEO_FORMATS.find(format => format.id === id) ?? VIDEO_FORMATS[0];
}

export function fitVideoPreview(width, height, format) {
  const scale = Math.min(width / format.width, height / format.height);
  return { width: format.width * scale, height: format.height * scale };
}

// Preserve the approved horizontal field of view; reveal more above/below.
// A shot may opt into a tighter portrait crop with verticalZoom > 1.
export function applyVideoFraming(camera, format, shot = {}) {
  camera.aspect = format.width / format.height;
  camera.zoom = format.id === 'vertical' ? camera.aspect / (16 / 9) * (shot.verticalZoom ?? 1) : 1;
  camera.updateProjectionMatrix();
}

export function videoFilename(sceneId, format) {
  return format.id === 'vertical' ? `${sceneId}-vertical` : sceneId;
}
