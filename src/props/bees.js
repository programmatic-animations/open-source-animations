import * as THREE from 'three';

export function createBee(baseX, baseY, baseZ, speed, phase) {
  const bee = new THREE.Group();

  const yellowMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4c400
  });

  const blackMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111
  });

  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide
  });

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 10, 10),
    yellowMaterial
  );

  body.scale.set(1.5, 1, 1);
  bee.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 10, 10),
    blackMaterial
  );

  head.position.x = 0.15;
  bee.add(head);

  const stripe1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.19, 0.19),
    blackMaterial
  );

  stripe1.position.x = -0.02;
  bee.add(stripe1);

  const stripe2 = stripe1.clone();
  stripe2.position.x = -0.10;
  bee.add(stripe2);

  const leftWing = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 10, 10),
    wingMaterial
  );

  leftWing.scale.set(1.2, 0.25, 0.65);
  leftWing.position.set(0, 0.11, 0.11);
  bee.add(leftWing);

  const rightWing = leftWing.clone();
  rightWing.position.z = -0.11;
  bee.add(rightWing);

  bee.position.set(baseX, baseY, baseZ);

  bee.userData = {
    baseX,
    baseY,
    baseZ,
    speed,
    phase,
    leftWing,
    rightWing,
    escapeStart: new THREE.Vector3()
  };

  return bee;
}

export function createBees({
  honeycomb,
  placements = [
    [-0.1, 0.2, 0.15, 1.7, 0],
    [0.15, -0.05, -0.15, 2.0, 2.3]
  ]
} = {}) {
  const bees = [];

  for (const [baseX, baseY, baseZ, speed, phase] of placements) {
    const bee = createBee(baseX, baseY, baseZ, speed, phase);
    honeycomb.add(bee);
    bees.push(bee);
  }

  return bees;
}

export function keepBeeOutsideHive(position) {
  const minDistance = 0.42;

  const distance = position.length();

  if (distance < minDistance) {
    if (distance < 0.001) {
      position.set(minDistance, 0, 0);
    } else {
      position.multiplyScalar(minDistance / distance);
    }
  }

  return position;
}

const beeTrunkBox = new THREE.Box3();
const beeTrunkCenter = new THREE.Vector3();

export function keepBeeOutsideTrunk(worldPosition, trunk) {
  beeTrunkBox
    .setFromObject(trunk)
    .expandByScalar(0.18);

  if (beeTrunkBox.containsPoint(worldPosition)) {
    beeTrunkBox.getCenter(beeTrunkCenter);

    if (worldPosition.x >= beeTrunkCenter.x) {
      worldPosition.x = beeTrunkBox.max.x + 0.12;
    } else {
      worldPosition.x = beeTrunkBox.min.x - 0.12;
    }
  }

  return worldPosition;
}
