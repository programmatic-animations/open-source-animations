import * as THREE from 'three';

export function lerpProgress(time, start, duration) {
  return THREE.MathUtils.clamp((time - start) / duration, 0, 1);
}

export function clampProgress(value, min = 0, max = 1) {
  return THREE.MathUtils.clamp(value, min, max);
}
