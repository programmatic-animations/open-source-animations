import * as THREE from 'three';

export function createPit({
  position = { x: 1.35, y: 0, z: 0 }
} = {}) {
  const pitGroup = new THREE.Group();
  pitGroup.position.set(position.x, position.y, position.z);

  const pitHole = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 1.8, 0.35, 32),
    new THREE.MeshStandardMaterial({
      color: 0x120c06
    })
  );

  pitHole.position.y = -0.17;
  pitGroup.add(pitHole);

  const leafCover = new THREE.Group();
  leafCover.position.y = 0.08;
  pitGroup.add(leafCover);

  const pitLeaves = [];

  const leafColors = [
    0x47752c,
    0x568632,
    0x668f38,
    0x76612d,
    0x8b6c32
  ];

  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2 + Math.sin(i * 2.1) * 0.3;
    const radius = 0.3 + ((i * 0.47) % 1) * 1.65;

    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 10, 10),
      new THREE.MeshStandardMaterial({
        color: leafColors[i % leafColors.length]
      })
    );

    leaf.position.set(
      Math.cos(angle) * radius,
      Math.sin(i * 1.7) * 0.05,
      Math.sin(angle) * radius
    );

    leaf.scale.set(1, 0.22, 0.7);

    leaf.rotation.y = i * 0.8;
    leaf.rotation.z = Math.sin(i) * 0.4;

    leaf.userData.startX = leaf.position.x;
    leaf.userData.startY = leaf.position.y;
    leaf.userData.startZ = leaf.position.z;

    leaf.userData.startRotX = leaf.rotation.x;
    leaf.userData.startRotZ = leaf.rotation.z;

    leafCover.add(leaf);
    pitLeaves.push(leaf);
  }

  return {
    pitGroup,
    pitHole,
    leafCover,
    pitLeaves
  };
}
