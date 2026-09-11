import * as THREE from 'three';

export function createRabbit({
  color = 0xb8a18a,
  bellyColor = 0xd8cbbb,
  eyeColor = 0x111111
} = {}) {
  const rabbit = new THREE.Group();

  const fur = new THREE.MeshStandardMaterial({
    color,
    roughness: 1
  });

  const soft = new THREE.MeshStandardMaterial({
    color: bellyColor,
    roughness: 1
  });

  const dark = new THREE.MeshStandardMaterial({
    color: eyeColor,
    roughness: 0.8
  });

  const toothMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4f4f4,
    roughness: 1
  });

  const mouthMaterial = new THREE.MeshStandardMaterial({
    color: 0x180707,
    roughness: 1
  });

  // BODY
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 16, 12),
    fur
  );
  body.scale.set(0.9, 1.15, 0.8);
  body.position.y = 0.45;
  rabbit.add(body);

  // HEAD
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.15;
  rabbit.add(headGroup);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 16, 12),
    fur
  );
  head.scale.set(1, 0.92, 0.9);
  headGroup.add(head);

  // EARS
  const earGeometry = new THREE.SphereGeometry(0.18, 12, 10);

  const leftEar = new THREE.Mesh(earGeometry, fur);
  leftEar.scale.set(0.75, 2.15, 0.55);
  leftEar.position.set(-0.2, 0.58, 0);
  leftEar.rotation.z = 0.1;
  headGroup.add(leftEar);

  const rightEar = new THREE.Mesh(earGeometry, fur);
  rightEar.scale.set(0.75, 2.15, 0.55);
  rightEar.position.set(0.2, 0.58, 0);
  rightEar.rotation.z = -0.1;
  headGroup.add(rightEar);

  const leftInnerEar = new THREE.Mesh(earGeometry, soft);
  leftInnerEar.scale.set(0.38, 1.65, 0.25);
  leftInnerEar.position.set(-0.2, 0.59, 0.12);
  headGroup.add(leftInnerEar);

  const rightInnerEar = new THREE.Mesh(earGeometry, soft);
  rightInnerEar.scale.set(0.38, 1.65, 0.25);
  rightInnerEar.position.set(0.2, 0.59, 0.12);
  headGroup.add(rightInnerEar);

  // OPEN EYES (circles)
  const eyeGeometry = new THREE.SphereGeometry(0.065, 12, 8);

  const leftEye = new THREE.Mesh(eyeGeometry, dark);
  leftEye.position.set(-0.15, 0.08, 0.36);
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, dark);
  rightEye.position.set(0.15, 0.08, 0.36);
  headGroup.add(rightEye);

  // CLOSED EYES (horizontal lines)
  const lineEyeGeometry = new THREE.BoxGeometry(0.14, 0.025, 0.025);

  const leftEyeLine = new THREE.Mesh(lineEyeGeometry, dark);
  leftEyeLine.position.set(-0.15, 0.08, 0.37);
  leftEyeLine.visible = false;
  headGroup.add(leftEyeLine);

  const rightEyeLine = new THREE.Mesh(lineEyeGeometry, dark);
  rightEyeLine.position.set(0.15, 0.08, 0.37);
  rightEyeLine.visible = false;
  headGroup.add(rightEyeLine);

  // MUZZLE
  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.19, 12, 10),
    soft
  );
  muzzle.scale.set(1.1, 0.7, 0.65);
  muzzle.position.set(0, -0.12, 0.36);
  headGroup.add(muzzle);

  // NOSE
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 10, 8),
    dark
  );
  nose.scale.set(1.2, 0.8, 0.75);
  nose.position.set(0, -0.07, 0.51);
  headGroup.add(nose);

  // JAW / MOUTH
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.24, 0.39);
  headGroup.add(jaw);

  const mouth = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 8),
    mouthMaterial
  );
  mouth.scale.set(1.1, 0.45, 0.35);
  jaw.add(mouth);

  // TEETH
  const teethGroup = new THREE.Group();
  teethGroup.visible = false;
  jaw.add(teethGroup);

  const toothGeometry = new THREE.BoxGeometry(0.05, 0.09, 0.03);

  const tooth1 = new THREE.Mesh(toothGeometry, toothMaterial);
  tooth1.position.set(-0.055, 0.01, 0.07);
  teethGroup.add(tooth1);

  const tooth2 = new THREE.Mesh(toothGeometry, toothMaterial);
  tooth2.position.set(0.0, 0.015, 0.07);
  teethGroup.add(tooth2);

  const tooth3 = new THREE.Mesh(toothGeometry, toothMaterial);
  tooth3.position.set(0.055, 0.01, 0.07);
  teethGroup.add(tooth3);

  return {
    rabbit,
    body,
    headGroup,
    leftEar,
    rightEar,

    leftEye,
    rightEye,
    leftEyeLine,
    rightEyeLine,

    jaw,
    mouth,
    teethGroup
  };
}