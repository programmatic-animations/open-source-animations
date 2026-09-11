import * as THREE from 'three';

export function createSceneRuntime({
  renderer,
  scene,
  camera,
  update,
  afterRender
}) {
  const clock = new THREE.Clock();
  let currentSceneTime = 0;
  let scenePaused = false;

  function animate() {
    requestAnimationFrame(animate);

    const time = scenePaused
      ? currentSceneTime
      : clock.getElapsedTime();

    currentSceneTime = time;

    update(time);

    renderer.render(scene, camera);

    afterRender?.(time);
  }

  return {
    start: animate,
    getCurrentTime: () => currentSceneTime,
    isPaused: () => scenePaused,
    pause() {
      scenePaused = true;
    },
    restartFromZero() {
      clock.stop();
      clock.elapsedTime = 0;
      clock.start();
      currentSceneTime = 0;
      scenePaused = false;
    }
  };
}
