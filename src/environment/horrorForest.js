import * as THREE from 'three';

// Deterministic bare branches, authored as geometry rather than a background image.
export function createHorrorForest({ clearPaths = [] } = {}) {
  const forest = new THREE.Group(); forest.name = 'horror-forest';
  const bark = new THREE.MeshStandardMaterial({ color: 0x20282e, roughness: 1 });
  const up = new THREE.Vector3(0, 1, 0);
  function limb(a, b, radius) {
    const delta = b.clone().sub(a);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.36, radius, delta.length(), 7), bark);
    mesh.position.copy(a).add(b).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(up, delta.normalize()); forest.add(mesh);
  }
  for (let i = 0; i < 25; i++) {
    const x = (i % 9 - 4) * 2.2 + Math.sin(i * 9) * 0.8;
    const z = -6.5 - Math.floor(i / 9) * 3 - Math.sin(i * 3) * 0.65;
    // Keep the escape lanes free of trunks instead of running through scenery.
    if (clearPaths.some(({ origin, direction }) => {
      const dx = x - origin.x, dz = z - origin.z;
      return dx * direction.x + dz * direction.z > 0 && Math.abs(dx * direction.z - dz * direction.x) < 1.1;
    })) continue;
    const height = 4.5 + (Math.sin(i * 17) + 1) * 2;
    const root = new THREE.Vector3(x, 1.6, z), top = root.clone().add(new THREE.Vector3(Math.sin(i) * 0.6, height, 0));
    limb(root, top, 0.15 + i % 3 * 0.035);
    for (let j = 0; j < 4; j++) {
      const start = root.clone().lerp(top, 0.35 + j * 0.14);
      const end = start.clone().add(new THREE.Vector3((j % 2 ? 1 : -1) * (0.8 + j * 0.12), 1 + j * 0.2, Math.sin(i + j) * 0.65));
      limb(start, end, 0.07 - j * 0.01);
      limb(end, end.clone().add(new THREE.Vector3((j % 2 ? -1 : 1) * 0.36, 0.75, 0.1)), 0.03);
    }
  }
  return forest;
}
