import * as THREE from 'three';

export function createBackdrop({
  textureUrl = '/forest-bg.png',
  position = { x: 0, y: 6, z: -10 },
  size = { width: 30, height: 17 }
} = {}) {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(textureUrl);
  texture.colorSpace = THREE.SRGBColorSpace;

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(size.width, size.height),
    new THREE.MeshBasicMaterial({
      map: texture
    })
  );

  backdrop.position.set(position.x, position.y, position.z);

  return backdrop;
}
