import * as THREE from 'three';

export function createBear({
  position = { x: -3, y: 0, z: 0 }
} = {}) {
  const bear = new THREE.Group();

  const bearBrown = new THREE.MeshStandardMaterial({
    color: 0x6b4226
  });

  const muzzleMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8875a
  });

  const blackMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111
  });

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 20, 20),
    bearBrown
  );

  body.scale.set(0.9, 1.2, 0.75);
  body.position.y = 0.85;
  bear.add(body);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.65, 0);
  bear.add(headGroup);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 20, 20),
    bearBrown
  );

  headGroup.add(head);

  const leftEar = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    bearBrown
  );

  leftEar.position.set(-0.35, 0.37, 0);
  headGroup.add(leftEar);

  const rightEar = leftEar.clone();
  rightEar.position.set(0.35, 0.37, 0);
  headGroup.add(rightEar);

  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 16, 16),
    muzzleMaterial
  );

  muzzle.scale.set(1, 0.75, 0.65);
  muzzle.position.set(0, -0.13, 0.42);
  headGroup.add(muzzle);

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 12),
    blackMaterial
  );

  nose.position.set(0, -0.07, 0.62);
  headGroup.add(nose);

  const eyeGeometry = new THREE.SphereGeometry(0.05, 12, 12);

  const leftEye = new THREE.Mesh(eyeGeometry, blackMaterial);
  leftEye.position.set(-0.17, 0.1, 0.45);
  headGroup.add(leftEye);

  const rightEye = leftEye.clone();
  rightEye.position.set(0.17, 0.1, 0.45);
  headGroup.add(rightEye);

  const legGeometry = new THREE.CylinderGeometry(
    0.16,
    0.18,
    0.65,
    12
  );

  const leftLeg = new THREE.Mesh(legGeometry, bearBrown);
  leftLeg.position.set(-0.3, 0.32, 0);
  bear.add(leftLeg);

  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.3;
  bear.add(rightLeg);

  const armGeometry = new THREE.CylinderGeometry(
    0.12,
    0.15,
    0.7,
    12
  );

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.53, 1.39, 0);
  leftArm.rotation.z = -0.25;
  bear.add(leftArm);

  const leftArmMesh = new THREE.Mesh(
    armGeometry,
    bearBrown
  );

  leftArmMesh.position.y = -0.35;

  leftArm.add(leftArmMesh);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.53, 1.39, 0);
  rightArm.rotation.z = 0.25;
  bear.add(rightArm);

  const rightArmMesh = new THREE.Mesh(
    armGeometry,
    bearBrown
  );

  rightArmMesh.position.y = -0.35;

  rightArm.add(rightArmMesh);

  bear.position.set(position.x, position.y, position.z);

  return {
    bear,
    body,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    nose
  };
}
