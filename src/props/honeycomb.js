import * as THREE from 'three';

export function createHoneycomb({
  position = { x: 3.15, y: -0.15, z: 0 },
  scale = 0.85
} = {}) {
  const honeycomb = new THREE.Group();

  const honeyMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2a900
  });

  const cellGeometry = new THREE.CylinderGeometry(
    0.22,
    0.22,
    0.18,
    6
  );

  const cells = [
    [0, 0],
    [0.35, 0],
    [-0.35, 0],
    [0.18, 0.3],
    [-0.18, 0.3],
    [0.18, -0.3],
    [-0.18, -0.3]
  ];

  for (const [x, y] of cells) {
    const cell = new THREE.Mesh(cellGeometry, honeyMaterial);
    cell.rotation.x = Math.PI / 2;
    cell.position.set(x, y, 0);
    honeycomb.add(cell);
  }

  honeycomb.position.set(position.x, position.y, position.z);
  honeycomb.scale.setScalar(scale);

  return honeycomb;
}
