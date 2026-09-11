import * as THREE from 'three';

export function createScentTrail() {
  const smellGroup = new THREE.Group();

  const smellMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4f0c7,
    transparent: true,
    opacity: 0.55
  });

  const smellParticles = [];

  const smellPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.7, 1.6, 0.4),
    new THREE.Vector3(-1.5, 1.7, 0.4),
    new THREE.Vector3(-0.7, 2.1, 0.4),
    new THREE.Vector3(-0.3, 3.0, 0.4),
    new THREE.Vector3(0.3, 3.6, 0.4),
    new THREE.Vector3(1.5, 3.4, 0.4),
    new THREE.Vector3(2.8, 3.2, 0.4)
  ]);

  for (let i = 0; i < 22; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      smellMaterial.clone()
    );

    const progress = i / 21;
    const point = smellPath.getPoint(progress);

    particle.position.copy(point);

    const scale = 0.5 + progress * 0.7;
    particle.scale.setScalar(scale);

    smellParticles.push(particle);
    smellGroup.add(particle);
  }

  return {
    smellGroup,
    smellParticles
  };
}
