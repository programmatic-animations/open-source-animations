import * as THREE from 'three';
import { createHoneycomb } from './honeycomb.js';

export function createTree({
  honeycomb = createHoneycomb()
} = {}) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.6, 4, 12),
    new THREE.MeshStandardMaterial({ color: 0x7a4b2a })
  );

  trunk.position.y = 2;
  tree.add(trunk);

  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f7f3a
  });

  const leaf1 = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 16, 16),
    leafMaterial
  );
  leaf1.position.set(0, 4.3, 0);

  const leaf2 = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 16, 16),
    leafMaterial
  );
  leaf2.position.set(-0.9, 4, 0);

  const leaf3 = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 16, 16),
    leafMaterial
  );
  leaf3.position.set(0.9, 4, 0);

  tree.add(leaf1, leaf2, leaf3);

  const branchPivot = new THREE.Group();
  branchPivot.position.set(0.25, 3.3, 0);

  const branch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 3.2, 10),
    new THREE.MeshStandardMaterial({ color: 0x6b3f22 })
  );

  branch.rotation.z = Math.PI / 2;
  branch.position.x = 1.6;

  branchPivot.add(branch);
  branchPivot.add(honeycomb);
  tree.add(branchPivot);

  return {
    tree,
    trunk,
    branchPivot,
    branch,
    honeycomb
  };
}
