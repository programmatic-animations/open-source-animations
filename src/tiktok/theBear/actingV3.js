import * as THREE from 'three';

const V = (...xyz) => new THREE.Vector3(...xyz);
const clamp = (t, a, b) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
const ease = (t, a, b) => { const p = clamp(t, a, b); return p * p * (3 - 2 * p); };
const UP = V(0, 1, 0);

// TikTok-only acting adjustments. Each function starts from an absolute-time
// source pose, so seeking and frame export produce the same image as playback.
export function createTheBearActing(worlds) {
  const trap = worlds.trap.actors;
  const nostrils = [-1, 1].map(side => {
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.023, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x160e0b, roughness: 0.85 }));
    n.position.set(side * 0.042, -0.066, 0.706);
    trap.b.headGroup.add(n);
    return n;
  });
  const deal = worlds.deal.actors;
  const rightArmMesh = deal.b.rightArm.children.find(child => child.isMesh);
  const fur = rightArmMesh.material;
  const segmentGeometry = new THREE.CylinderGeometry(0.12, 0.14, 1, 12);
  const pickupArm = new THREE.Group(); deal.b.bear.add(pickupArm);
  const upper = new THREE.Mesh(segmentGeometry, fur), lower = new THREE.Mesh(segmentGeometry, fur);
  const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), fur);
  const paw = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), fur);
  pickupArm.add(upper, lower, elbow, paw);
  const rimStones = worlds.deal.root.children.filter(o => o.isMesh && o.geometry.type === 'DodecahedronGeometry' && o.position.y > 0);
  const revengeRimStones = worlds.revenge.root.children.filter(o => o.isMesh && o.geometry.type === 'DodecahedronGeometry' && o.position.y > 0);
  const escapeShadows = worlds.revenge.actors.rabbits.slice(1).map(() => {
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24),
      new THREE.MeshBasicMaterial({ color: 0x080b0d, transparent: true, opacity: 0.42, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 1.638;
    worlds.revenge.root.add(shadow);
    return shadow;
  });
  const trapLeaves = worlds.trap.root.children.flatMap(o => o.children || []).filter(o =>
    o.isMesh && o.geometry.type === 'SphereGeometry' && o.material?.color?.getHex() === 0x3f7f3a);
  const trapBranchRotation = trap.branchPivot.rotation.clone();
  const trapBranchPosition = trap.branchPivot.position.clone();
  const trapNoseScale = trap.b.nose.scale.clone();
  const pitBear = worlds.pit.actors.b;
  const dealBearRotation = deal.b.bear.rotation.clone();
  const revengeArmRotations = [worlds.revenge.actors.b.leftArm, worlds.revenge.actors.b.rightArm].map(arm => arm.rotation.clone());
  const escapeRoots = worlds.revenge.actors.rabbits.slice(1).map(r => r.rabbit.position.clone());
  const escapeArmPositions = worlds.revenge.actors.rabbits.slice(1).map(r => r.arms.map(({ arm, paw, finger }) => ({
    arm: arm.position.clone(), paw: paw.position.clone(), finger: finger.position.clone()
  })));
  pitBear.bear.traverse(o => {
    if (!o.isMesh) return;
    o.material = o.material.clone();
    o.material.color.setHex(o === pitBear.headGroup.children[3] ? 0xb8875a :
      pitBear.headGroup.children.slice(4).includes(o) ? 0x111111 : 0x6b4226);
  });
  function segment(mesh, start, end) {
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.scale.y = start.distanceTo(end);
    mesh.quaternion.setFromUnitVectors(UP, end.clone().sub(start).normalize());
  }
  function trapPose(t) {
    trapLeaves.forEach(leaf => { leaf.visible = false; });
    // A faint recoil on each alternating crawl step travels through the branch.
    const steps = Math.max(0, 1 - ease(t, 15.55, 16.2));
    const pulse = Math.sin((t - 11) * 18) * 0.018 * steps;
    trap.branchPivot.rotation.copy(trapBranchRotation);
    trap.branchPivot.rotation.z += pulse;
    trap.branchPivot.position.copy(trapBranchPosition);
    trap.branchPivot.position.y += Math.abs(pulse) * 0.35;
    const flare = 1 + Math.pow(Math.sin((t - 12) * 12), 2) * 1.15;
    nostrils.forEach(n => { n.scale.set(flare, 0.8 + (flare - 1) * 0.55, 1); });
    trap.b.nose.scale.copy(trapNoseScale);
    trap.b.nose.scale.x *= 1 + (flare - 1) * 0.11;
  }
  function pitPose(t) {
    const { b, bees } = worlds.pit.actors;
    // Sitting is already complete when we cut in. Extend both legs forward.
    b.leftLeg.rotation.x = b.rightLeg.rotation.x = -Math.PI / 2;
    b.leftLeg.scale.y = b.rightLeg.scale.y = 1.55;
    b.leftLeg.position.z = b.rightLeg.position.z = 0.26;
    b.bear.updateMatrixWorld(true);
    const head = b.headGroup.getWorldPosition(V());
    bees.forEach((bee, i) => {
      const source = bee.position.clone();
      const angle = (t - 2.6) * 8 + i * Math.PI;
      const orbit = head.clone().add(V(Math.cos(angle) * 0.62, 0.22 + Math.sin(angle * 1.3) * 0.13, -0.55 + Math.sin(angle) * 0.18));
      const flyOut = ease(t, 3.05, 3.85);
      bee.position.copy(orbit).lerp(source, flyOut);
    });
  }
  function dealPose(t) {
    const { b, honey } = deal;
    b.bear.rotation.copy(dealBearRotation);
    pickupArm.visible = t >= 10 && t < 12.82;
    rightArmMesh.visible = !pickupArm.visible;
    if (!pickupArm.visible) pickupArm.children.forEach(child => {
      child.position.set(0, 0, 0); child.quaternion.identity(); child.scale.set(1, 1, 1);
    });
    if (pickupArm.visible) {
      const reach = ease(t, 10.2, 11.48);
      const lift = ease(t, 11.55, 12.72);
      const ground = V(0.12, -3.19, 0.65);
      b.leftLeg.rotation.x = b.rightLeg.rotation.x = THREE.MathUtils.lerp(0.9, 0, ease(t, 11.75, 12.82));
      b.bear.rotation.x = dealBearRotation.x * 0.69;
      b.bear.updateMatrixWorld(true);
      const shoulder = b.rightArm.getWorldPosition(V());
      const restingWrist = b.rightArm.localToWorld(V(0, -0.7, 0));
      const targetWrist = ground.clone().add(V(0.04, 0.08, 0.05));
      const wrist = restingWrist.clone().lerp(targetWrist, reach);
      // Lift begins only after the paw has settled on the comb.
      wrist.lerp(restingWrist, lift);
      if (t >= 11.55) {
        honey.position.copy(ground).lerp(restingWrist, lift);
        honey.position.y += Math.sin(Math.PI * lift) * 0.08;
        honey.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, 0, lift);
      } else honey.position.copy(ground);
      const elbowWorld = shoulder.clone().lerp(wrist, 0.48).add(V(0.13, 0.01, -0.12));
      const localShoulder = b.bear.worldToLocal(shoulder.clone());
      const localElbow = b.bear.worldToLocal(elbowWorld);
      const localWrist = b.bear.worldToLocal(wrist);
      segment(upper, localShoulder, localElbow);
      segment(lower, localElbow, localWrist);
      elbow.position.copy(localElbow); paw.position.copy(localWrist);
    }
    // The stand keeps his chest toward the rabbits. His downward eye line is untouched.
    if (t >= 35.4) b.bear.rotation.y = Math.PI;
  }
  function revengePose(t, framing) {
    const { b, rabbits } = worlds.revenge.actors;
    const forest = worlds.revenge.root.getObjectByName('horror-forest');
    forest.children.forEach(o => { o.visible = true; });
    escapeShadows.forEach(s => { s.visible = false; s.position.x = s.position.z = 0; });
    b.leftArm.rotation.copy(revengeArmRotations[0]);
    b.rightArm.rotation.copy(revengeArmRotations[1]);
    // Match the previous angry frame across the cut. The next framing starts
    // on hands, allowing the original spear choreography to continue intact.
    if (t <= 2) b.bear.rotation.y = Math.PI;
    if (framing === 'fingers-push') {
      const gather = ease(t, 4.8, 7.15);
      b.leftArm.rotation.z = THREE.MathUtils.lerp(revengeArmRotations[0].z, 0.35, gather);
      b.rightArm.rotation.z = THREE.MathUtils.lerp(revengeArmRotations[1].z, -0.35, gather);
    }
    if (framing === 'point') {
      worlds.revenge.root.traverse(o => { if (o.name.startsWith('story-ladder-') || o.name.startsWith('ladder-rung-')) o.visible = false; });
      worlds.revenge.root.children.filter(o => o.geometry?.type === 'DodecahedronGeometry').forEach(o => { o.visible = false; });
    }
    if (framing === 'run-group') {
      const run = ease(t, 34, 39);
      rabbits.slice(1).forEach((r, i) => {
        const start = escapeRoots[i];
        r.rabbit.position.copy(start);
        r.rabbit.position.x = start.x * (1 - 0.85 * run);
        const deltaX = r.rabbit.position.x - start.x;
        r.arms.forEach(({ arm, paw, finger }, partIndex) => {
          const base = escapeArmPositions[i][partIndex];
          arm.position.copy(base.arm); paw.position.copy(base.paw); finger.position.copy(base.finger);
          arm.position.x += deltaX; paw.position.x += deltaX; finger.position.x += deltaX;
        });
        const shadow = escapeShadows[i];
        shadow.visible = true;
        shadow.position.x = r.rabbit.position.x;
        shadow.position.z = r.rabbit.position.z;
      });
      forest.children.forEach(o => { o.visible = Math.abs(o.position.x) > 5.5; });
    }
  }
  function rimVisibility(world) {
    const stones = world === worlds.deal ? rimStones : world === worlds.revenge ? revengeRimStones : [];
    stones.forEach(stone => { stone.visible = false; });
  }
  return { trapPose, pitPose, dealPose, revengePose, rimVisibility };
}
