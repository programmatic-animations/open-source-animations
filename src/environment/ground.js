import * as THREE from 'three';

export function createGround({
  size = 30,
  color = 0x5f8f3d
} = {}) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ color })
  );

  ground.rotation.x = -Math.PI / 2;

  return ground;
}
