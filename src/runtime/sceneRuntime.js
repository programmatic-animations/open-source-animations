import * as THREE from 'three';

export function createSceneRuntime({
  renderer,
  scene,
  camera,
  update,
  afterRender,
  duration = Infinity
}) {
  const clock = new THREE.Clock();
  let currentSceneTime = 0;
  let scenePaused = false;
  let timeOffset = 0;

  function animate() {
    requestAnimationFrame(animate);

    const time = scenePaused
      ? currentSceneTime
      : Math.min(duration, clock.getElapsedTime() + timeOffset);

    if (time >= duration) scenePaused = true;

    currentSceneTime = time;

    update(time);

    renderer.render(scene, camera);

    afterRender?.(time);
  }

  return {
    start: animate,
    getCurrentTime: () => currentSceneTime,
    isPaused: () => scenePaused,
    seek(time) {
      timeOffset = Math.max(0, Math.min(duration, time));
      currentSceneTime = timeOffset;
      clock.start();
    },
    resume() {
      timeOffset = currentSceneTime;
      clock.start();
      scenePaused = false;
    },
    pause() {
      scenePaused = true;
    },
    restartFromZero() {
      clock.stop();
      clock.elapsedTime = 0;
      clock.start();
      currentSceneTime = 0;
      timeOffset = 0;
      scenePaused = false;
    }
  };
}
