import * as THREE from 'three';

const V = (...xyz) => new THREE.Vector3(...xyz);
const clamp = (t, a, b) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
const ease = (t, a, b) => { const p = clamp(t, a, b); return p * p * (3 - 2 * p); };

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
  const brows = [-1, 1].map(side => {
    const brow = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.23, 8),
      new THREE.MeshStandardMaterial({ color: 0x38251a, roughness: 1 }));
    brow.rotation.z = Math.PI / 2;
    brow.position.set(side * 0.165, 0.235, 0.462);
    trap.b.headGroup.add(brow);
    return brow;
  });
  const deal = worlds.deal.actors;
  const rimStones = worlds.deal.root.children.filter(o => o.isMesh && o.geometry.type === 'DodecahedronGeometry' && o.position.y > 0);
  const revengeRimStones = worlds.revenge.root.children.filter(o => o.isMesh && o.geometry.type === 'DodecahedronGeometry' && o.position.y > 0);
  const escapeShadows = worlds.revenge.actors.rabbits.slice(1).map(() => {
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24),
      new THREE.MeshBasicMaterial({ color: 0x080b0d, transparent: true, opacity: 0.42, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 1.638;
    worlds.revenge.root.add(shadow);
    return shadow;
  });
  worlds.revenge.update(36.5);
  const escapeEndRoots = worlds.revenge.actors.rabbits.slice(1).map(r => r.rabbit.position.clone());
  worlds.revenge.update(0);
  const trapLeaves = worlds.trap.root.children.flatMap(o => o.children || []).filter(o =>
    o.isMesh && o.geometry.type === 'SphereGeometry' && o.material?.color?.getHex() === 0x3f7f3a);
  const trapBranchRotation = trap.branchPivot.rotation.clone();
  const trapBranchPosition = trap.branchPivot.position.clone();
  const trapNoseScale = trap.b.nose.scale.clone();
  const pitBear = worlds.pit.actors.b;
  const pitGroup = worlds.pit.root.children.find(o => o.children.some(child => child.geometry?.type === 'CylinderGeometry' && child.geometry.parameters.radiusTop > 2));
  const pitWall = pitGroup.children.find(o => o.geometry?.type === 'CylinderGeometry');
  const pitFloor = pitGroup.children.find(o => o.geometry?.type === 'CircleGeometry');
  pitBear.bear.traverse(o => {
    if (!o.isMesh) return;
    o.material = o.material.clone();
    o.material.color.setHex(o === pitBear.headGroup.children[3] ? 0xb8875a :
      pitBear.headGroup.children.slice(4).includes(o) ? 0x111111 : 0x6b4226);
  });
  function trapPose(t) {
    trapLeaves.forEach(leaf => { leaf.visible = false; });
    trap.b.leftArm.scale.y = trap.b.rightArm.scale.y = 1;
    const climbEffort = ease(t, 7.5, 8.1) * (1 - ease(t, 10.6, 11.4));
    brows.forEach((brow, i) => {
      const side = i ? 1 : -1;
      brow.position.y = 0.235 + 0.025 * (1 - ease(t, 1.4, 3)) - 0.055 * climbEffort;
      brow.rotation.z = Math.PI / 2 + side * (0.07 + 0.2 * climbEffort);
    });
    if (t >= 2 && t < 4.2) {
      // The walk is a choice toward the tree. Let the gaze lead the body and
      // reduce the legacy cycle's bounce without changing leg proportions.
      const intention = ease(t, 2.15, 3.35);
      trap.b.headGroup.rotation.y += 0.3 * intention;
      trap.b.bear.position.y *= 0.55;
      trap.b.leftLeg.rotation.x *= 0.72;
      trap.b.rightLeg.rotation.x *= 0.72;
      trap.b.leftArm.rotation.x *= 0.7;
      trap.b.rightArm.rotation.x *= 0.7;
    }
    if (t >= 7.5 && t < 11.3) {
      // Stage the existing bear against the front of the trunk. Both fixed
      // forearms reach its surface as his root rises; the final easing moves
      // him around to the branch rather than leaving him floating beside it.
      const grip = ease(t, 7.5, 7.88) * (1 - ease(t, 10.72, 11.28));
      trap.b.bear.position.x = THREE.MathUtils.lerp(trap.b.bear.position.x, 0, grip);
      const trunkTaper = clamp(t, 7.5, 11);
      trap.b.bear.position.z = THREE.MathUtils.lerp(trap.b.bear.position.z, 1.08 - 0.07 * trunkTaper, grip);
      trap.b.bear.rotation.y = THREE.MathUtils.lerp(trap.b.bear.rotation.y, Math.PI, grip);
      const pawPitch = -1.14 - 0.14 * trunkTaper;
      trap.b.leftArm.rotation.x = THREE.MathUtils.lerp(trap.b.leftArm.rotation.x, pawPitch, grip);
      trap.b.rightArm.rotation.x = THREE.MathUtils.lerp(trap.b.rightArm.rotation.x, pawPitch, grip);
      trap.b.leftArm.rotation.z = THREE.MathUtils.lerp(trap.b.leftArm.rotation.z, 0.35, grip);
      trap.b.rightArm.rotation.z = THREE.MathUtils.lerp(trap.b.rightArm.rotation.z, -0.35, grip);
      trap.b.headGroup.rotation.y += 0.12 * grip;
    }
    // A faint recoil on each alternating crawl step travels through the branch.
    const steps = Math.max(0, 1 - ease(t, 15.55, 16.2));
    const pulse = Math.sin((t - 11) * 18) * 0.018 * steps;
    if (t < 16.2) {
      trap.branchPivot.rotation.copy(trapBranchRotation);
      trap.branchPivot.rotation.z += pulse;
      trap.branchPivot.position.copy(trapBranchPosition);
      trap.branchPivot.position.y += Math.abs(pulse) * 0.35;
    }
    const flare = 1 + Math.pow(Math.sin((t - 12) * 12), 2) * 1.15;
    nostrils.forEach(n => { n.scale.set(flare, 0.8 + (flare - 1) * 0.55, 1); });
    trap.b.nose.scale.copy(trapNoseScale);
    trap.b.nose.scale.x *= 1 + (flare - 1) * 0.11;
  }
  function pitPose(t) {
    const { b, bees, honey } = worlds.pit.actors;
    // The whole legacy location is rebuilt at Episode 2's pit depth. Keep
    // original limb proportions while the approved sit-up plays from impact.
    pitWall.position.y = -0.88;
    pitWall.scale.y = 5 / 3.2;
    pitFloor.position.y = -3.38;
    b.bear.position.y -= 1.8;
    honey.parent.position.y -= 1.8;
    worlds.pit.root.updateMatrixWorld(true);
    honey.position.copy(honey.parent.worldToLocal(V(0.12, -3.19, 0.65)));
    b.bear.updateMatrixWorld(true);
    const head = b.headGroup.getWorldPosition(V());
    bees.forEach((bee, i) => {
      const source = bee.position.clone();
      const angle = (t - 2.6) * 8 + i * Math.PI;
      const side = i ? 1 : -1;
      // Circle beside his ears; never cross the eyes and muzzle during the
      // sit-up, where his disorientation is the point of the shot.
      const orbit = head.clone().add(V(side * (0.9 + 0.12 * Math.sin(angle)), 0.3 + Math.sin(angle * 1.3) * 0.13, -0.12 + Math.sin(angle) * 0.18));
      const flyOut = ease(t, 3.05, 3.85);
      bee.position.copy(orbit).lerp(source, flyOut);
    });
  }
  function dealPose(t) {
    const { b, honey } = deal;
    if (t >= 4 && t < 6.2) {
      const pressure = ease(t, 4, 4.6) * (1 - ease(t, 5.65, 6.2));
      deal.rabbits[0].headGroup.rotation.z -= 0.14 * pressure;
    }
    if (t >= 7 && t < 10) {
      // The promised escape draws his attention back up to the rabbits.
      b.headGroup.rotation.y = THREE.MathUtils.lerp(-0.32, 0, ease(t, 7.3, 9.1));
      b.headGroup.rotation.x += 0.10 * Math.sin(Math.PI * clamp(t, 7, 10));
    }
    if (t >= 10 && t < 12.82) {
      const reach = ease(t, 10.25, 11.47);
      const release = ease(t, 11.55, 12.82);
      const contact = reach * (1 - release);
      // Turn the existing shoulder pivot toward the comb. The legacy arm is
      // short, so the target is the comb's near upper surface, not its center.
      b.rightArm.rotation.x = THREE.MathUtils.lerp(b.rightArm.rotation.x, -0.25, contact);
      b.rightArm.rotation.z = THREE.MathUtils.lerp(b.rightArm.rotation.z, 0.10, contact);
      b.headGroup.rotation.x += 0.22 * contact;
      const sourceTilt = honey.rotation.x;
      const lift = ease(t, 11.55, 12.82);
      if (t < 11.55) honey.position.set(0.12, -3.19, 0.65);
      else {
        b.bear.updateMatrixWorld(true);
        const palm = b.rightArm.localToWorld(V(0, -0.7, 0));
        honey.position.copy(palm).add(V(0, -0.16 * (1 - lift), 0));
      }
      honey.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, sourceTilt, lift);
    }
    if (t >= 39 && t < 42) {
      // After the second fall, let the hurt register before his anger locks in.
      const hurt = ease(t, 39, 39.35) * (1 - ease(t, 40.9, 42));
      b.headGroup.rotation.x += 0.28 * hurt;
      b.headGroup.rotation.z += 0.07 * hurt;
      b.leftArm.rotation.x = THREE.MathUtils.lerp(b.leftArm.rotation.x, 0, hurt);
      b.rightArm.rotation.x = THREE.MathUtils.lerp(b.rightArm.rotation.x, 0, hurt);
      b.leftArm.rotation.z = THREE.MathUtils.lerp(b.leftArm.rotation.z, -0.12, hurt);
      b.rightArm.rotation.z = THREE.MathUtils.lerp(b.rightArm.rotation.z, 0.12, hurt);
    }
    // The stand keeps his chest toward the rabbits. His downward eye line is untouched.
    if (t >= 35.4) b.bear.rotation.y = Math.PI;
  }
  function revengePose(t, framing) {
    const { b, rabbits } = worlds.revenge.actors;
    escapeShadows.forEach(s => { s.visible = false; s.position.x = s.position.z = 0; });
    // Match the previous angry frame across the cut. The next framing starts
    // on hands, allowing the original spear choreography to continue intact.
    if (t <= 2) b.bear.rotation.y = Math.PI;
    if (framing === 'fingers-push') {
      const gather = ease(t, 4.8, 7.15);
      b.leftArm.rotation.z = THREE.MathUtils.lerp(b.leftArm.rotation.z, 0.35, gather);
      b.rightArm.rotation.z = THREE.MathUtils.lerp(b.rightArm.rotation.z, -0.35, gather);
    }
    if (framing === 'run-group') rabbits.slice(1).forEach((r, i) => {
      const shadow = escapeShadows[i];
      shadow.visible = true;
      shadow.position.x = r.rabbit.position.x;
      shadow.position.z = r.rabbit.position.z;
    });
    if (framing === 'grin-push') rabbits.slice(1).forEach((r, i) => {
      const delta = escapeEndRoots[i].clone().sub(r.rabbit.position);
      r.rabbit.position.copy(escapeEndRoots[i]);
      r.arms.forEach(({ arm, paw, finger }) => {
        arm.position.add(delta); paw.position.add(delta); finger.position.add(delta);
      });
    });
  }
  function rimVisibility(world) {
    const stones = world === worlds.deal ? rimStones : world === worlds.revenge ? revengeRimStones : [];
    stones.forEach(stone => { stone.visible = false; });
  }
  return { trapPose, pitPose, dealPose, revengePose, rimVisibility };
}
