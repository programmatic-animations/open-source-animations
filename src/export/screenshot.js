import { resolveVideoFormat, videoFilename } from '../runtime/videoFormat.js';
import * as THREE from 'three';

export function captureScreenshot({
  renderer,
  scene,
  camera,
  filename = 'scene.png',
  width = 1920,
  height = 1080,
  saveToProject = false,
  onSaved = () => {}
}) {
  // Preserve current renderer/camera state
  const oldSize = renderer.getSize(new THREE.Vector2());
  const oldPixelRatio = renderer.getPixelRatio();
  const oldAspect = camera.aspect;

  // Render exact output resolution
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.render(scene, camera);

  // Capture only the Three.js canvas
  renderer.domElement.toBlob(async (blob) => {
    if (!blob) return;

    try {
      if (saveToProject) {
        const response = await fetch('http://127.0.0.1:5174/thumbnail', {
          method: 'POST', headers: { 'Content-Type': 'image/png', 'X-Scene-Id': filename.replace(/\.png$/, '') }, body: blob
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        onSaved(`Saved: ${result.file}`);
      } else {
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);

      }
    } catch (error) { onSaved(`Save failed: ${error.message}`); }
    // Restore normal screen rendering
    renderer.setPixelRatio(oldPixelRatio);
    renderer.setSize(oldSize.x, oldSize.y, false);

    camera.aspect = oldAspect;
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
  }, 'image/png');
}

export function setupScreenshotButton({
  renderer,
  scene,
  camera,
  filename = 'scene.png',
  saveToProject = false,
  getVideoFormat = () => resolveVideoFormat()
}) {
  const button = document.createElement('button');

  button.textContent = saveToProject ? 'Save thumbnail PNG' : 'Save 1080p PNG';

  Object.assign(button.style, {
    position: 'fixed',
    top: '130px',
    right: '20px',
    padding: '12px 18px',
    border: 'none',
    borderRadius: '8px',
    background: '#111',
    color: '#fff',
    cursor: 'pointer',
    zIndex: '9999'
  });

  button.onclick = () => {
    const format = saveToProject ? resolveVideoFormat() : getVideoFormat();
    captureScreenshot({
      renderer,
      scene,
      camera,
      filename: `${videoFilename(filename.replace(/\.png$/, ''), format)}.png`,
      width: format.width,
      height: format.height,
      saveToProject,
      onSaved: message => { button.textContent = message; }
    });
  };

  document.body.appendChild(button);

  return button;
}