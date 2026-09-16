import * as THREE from 'three';
import { createBear } from '../characters/bear.js';
import { createRabbit } from '../characters/rabbit.js';
import { createHoneycomb } from '../props/honeycomb.js';
import { createBackdrop } from '../environment/backdrop.js';

import { HONEY_BETRAYAL_SHOTS } from '../shots/honeyBetrayalShots.js';
import { updateShot } from '../runtime/shotTimeline.js';

export const SCENE_CONFIG = {
  id: 'honey-betrayal', title: 'The Honey Deal',
  duration: HONEY_BETRAYAL_SHOTS.at(-1).end, shots: HONEY_BETRAYAL_SHOTS
};
export const SHOTS = HONEY_BETRAYAL_SHOTS.map(({ start, title }) => [start, title]);
const p = (t, a, b) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
const ease = (t, a, b) => { const v = p(t, a, b); return v * v * (3 - 2 * v); };
const mix = THREE.MathUtils.lerp;
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

// All poses derive from absolute time, including props: replay and scrubbing are reversible.
export function createHoneyBetrayalScene({ scene, camera }) {
  scene.background = new THREE.Color(0xa9cbd2);
  scene.add(createBackdrop({ position: { x: 0, y: 6, z: -12 } }));
  const ambient = new THREE.HemisphereLight(0xc5e6ff, 0x6d4631, 1.7);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffe1a5, 3.0);
  sun.position.set(-3, 8, 4); scene.add(sun);
  const fill = new THREE.PointLight(0xbedcff, 24, 12, 2);
  fill.position.set(0, -0.5, 2); scene.add(fill);
  const angerLight = new THREE.PointLight(0xff652e, 0, 7, 2);
  angerLight.position.set(-1.5, -1.7, 1); scene.add(angerLight);
  const dirt = new THREE.MeshStandardMaterial({ color: 0x563f30, roughness: 1, side: THREE.BackSide });
  const grass = new THREE.MeshStandardMaterial({ color: 0x658047, roughness: 1, side: THREE.DoubleSide });
  const dark = new THREE.MeshStandardMaterial({ color: 0x211711, roughness: 1 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xc6a574, roughness: 1 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x785136, roughness: 1 });
  function mesh(geometry, material, parent = scene) {
    const m = new THREE.Mesh(geometry, material); parent.add(m); return m;
  }
  const wall = mesh(new THREE.CylinderGeometry(3.25, 2.85, 5, 64, 1, true), dirt);
  wall.position.y = -0.88;
  const floor = mesh(new THREE.CircleGeometry(2.86, 64), new THREE.MeshStandardMaterial({ color: 0x69503a, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -3.38;
  const rim = mesh(new THREE.RingGeometry(3.24, 15, 80), grass);
  rim.rotation.x = -Math.PI / 2; rim.position.y = 1.63;
  for (let i = 0; i < 55; i++) {
    const angle = i * 2.39996;
    const radius = i < 30 ? 3.27 : 2.2 + 0.5 * Math.sin(i);
    const stone = mesh(new THREE.DodecahedronGeometry(0.09 + (i % 4) * 0.035), wood);
    stone.position.set(Math.cos(angle) * radius, i < 30 ? 1.64 : -3.33, Math.sin(angle) * radius);
    stone.scale.set(1.4, 0.6, 1); stone.rotation.set(i, i * 2, 0);
  }
  // A broken branch preserves the previous shot's aftermath.
  const branch = mesh(new THREE.CylinderGeometry(0.07, 0.13, 1.7, 9), wood);
  branch.position.set(1.1, -3.24, 0.05); branch.rotation.set(0.2, 0.4, 1.4);

  const b = createBear(); b.bear.name = 'story-bear'; scene.add(b.bear); b.bear.scale.setScalar(0.86);
  const honey = createHoneycomb({ position: { x: 0, y: 0, z: 0 }, scale: 0.6 }); honey.name = 'story-honey'; scene.add(honey);
  function rod(parent, material, radius = 0.025) {
    return mesh(new THREE.CylinderGeometry(radius, radius, 1, 10), material, parent);
  }
  const axis = v3(0, 1, 0);
  function segment(m, a, z) {
    m.position.copy(a).add(z).multiplyScalar(0.5);
    m.scale.y = a.distanceTo(z);
    m.quaternion.setFromUnitVectors(axis, z.clone().sub(a).normalize());
  }
  // Expressive brows, muzzle crease and forehead folds are geometry, so close-ups stay crisp.
  const brows = [-1, 1].map(() => rod(b.headGroup, dark, 0.025));
  const creases = Array.from({ length: 6 }, () => rod(b.headGroup, dark, 0.005));
  const mouth = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    v3(-0.16, -0.25, 0.575), v3(0, -0.185, 0.614), v3(0.16, -0.25, 0.575)
  ]), 24, 0.018, 6, false), dark, b.headGroup);
  const eyes = b.headGroup.children.filter(o => o.isMesh && o.geometry.parameters.radius === 0.05);

  const colors = [[0xb8a18a, 0xd8cbbb], [0xd8d8d8, 0xf0eeee], [0x8c8c8c, 0xcacaca], [0x8b684d, 0xc9ad92]];
  const rabbits = colors.map(([color, bellyColor], i) => {
    const r = createRabbit({ color, bellyColor }); scene.add(r.rabbit);
    r.rabbit.position.set([-0.68, 0.68, -1.9, 1.9][i], 1.64, i < 2 ? -3.28 : -2.9);
    r.headGroup.scale.setScalar(1.12);
    const fur = new THREE.MeshStandardMaterial({ color, roughness: 1 });
    r.arms = [-1, 1].map(side => {
      const arm = rod(scene, fur, 0.09);
      const paw = mesh(new THREE.SphereGeometry(0.12, 12, 10), fur);
      const finger = rod(scene, fur, 0.044);
      return { arm, paw, finger, side };
    });
    return r;
  });
  const ropes = Array.from({ length: 2 }, () => Array.from({ length: 15 }, () => rod(scene, ropeMat, 0.035)));
  const rungs = Array.from({ length: 15 }, () => rod(scene, wood, 0.055));
  const dust = Array.from({ length: 25 }, (_, i) => {
    const m = mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0xa48a69, transparent: true, depthWrite: false }));
    m.userData.phase = i * 2.39996; return m;
  });
  const rightPaw = v3(0, -0.7, 0);
  const held = new THREE.Vector3();
  function shot(position, target, fov) {
    camera.position.set(...position); camera.lookAt(...target);
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  }
  function update(rawTime) {
    const editorialTime = Math.min(rawTime, SCENE_CONFIG.duration);
    // Insert four seconds without disturbing the established downstream choreography.
    const reaction = editorialTime >= 27 && editorialTime < 31;
    const t = editorialTime < 27 ? editorialTime : Math.max(27, editorialTime - 4);
    const stand = ease(t, 10, 12), approach = ease(t, 16, 18);
    const climb = ease(t, 18, 23), fall = p(t, 32, 33.15), recovery = ease(t, 35.4, 37.8);
    const anger = ease(t, 38.6, 40.2);
    b.bear.position.set(mix(-0.4, 0, approach), -3.36 + 3.5 * climb, mix(0.15, -2.28, approach));
    b.bear.rotation.set(0, Math.PI * approach, 0);
    b.headGroup.rotation.set(t < 10 ? -0.28 : -0.12, 0, 0);
    b.leftLeg.rotation.x = b.rightLeg.rotation.x = (1 - stand) * 1.1;
    b.leftArm.rotation.set(0, 0, -0.25); b.rightArm.rotation.set(0, 0, 0.25);
    // Three deliberate nods accept the bargain.
    if (t >= 7 && t < 10) b.headGroup.rotation.x += Math.sin(p(t, 7, 10) * Math.PI * 6) * 0.19;
    const pick = ease(t, 10.3, 11.3) * (1 - ease(t, 11.8, 12.8));
    b.bear.rotation.x = pick * 0.75;
    b.rightArm.rotation.x = -0.55 - ease(t, 11.4, 12.7) * 0.8;
    if (t >= 18 && t < 23) {
      const cycle = (t - 18) * 7;
      b.leftArm.rotation.x = -2.5 + Math.sin(cycle) * 0.35;
      b.leftLeg.rotation.x = Math.sin(cycle) * 0.5;
      b.rightLeg.rotation.x = -Math.sin(cycle) * 0.5;
      b.bear.position.y += Math.sin(cycle * 2) * 0.035;
    } else if (t >= 23 && t < 32) b.leftArm.rotation.x = -2.5;
    // Hold below the rim; extend the comb only after the rabbits insist.
    if (t >= 27) b.rightArm.rotation.x = mix(-1.6, -2.25, ease(t, 27, 28.5));
    if (t >= 32) {
      const drop = fall * fall;
      b.bear.position.set(0.15 * Math.sin(fall * 5), mix(0.14, -3.28, drop), mix(-2.28, -0.1, fall));
      b.bear.rotation.set(-1.25 * fall * (1 - recovery), Math.PI * (1 - recovery), 0.17 * Math.sin(fall * 7) * (1 - recovery));
      b.bear.position.y = mix(b.bear.position.y, -3.36, recovery);
      b.leftArm.rotation.set(-2.5 * (1 - recovery), 0, -0.6 * (1 - recovery) - 0.18);
      b.rightArm.rotation.set(-2.3 * (1 - recovery), 0, 0.6 * (1 - recovery) + 0.18);
      b.leftLeg.rotation.x = 0.6 * (1 - recovery); b.rightLeg.rotation.x = -0.4 * (1 - recovery);
      b.headGroup.rotation.x = mix(0.3, -0.04, recovery) + 0.15 * anger;
    }
    if (reaction) {
      const lookHand = ease(editorialTime, 28, 28.8);
      const consent = ease(editorialTime, 29.3, 30.1);
      b.headGroup.rotation.y = mix(0.6, 1.05, lookHand) - consent * 0.25;
      b.headGroup.rotation.x = mix(-0.42, -0.08, lookHand) - consent * 0.04;
      b.headGroup.rotation.z = -0.07 * Math.sin(p(editorialTime, 27, 31) * Math.PI);
      b.rightArm.rotation.x = mix(-1.35 + lookHand * 0.2, -1.6, ease(editorialTime, 29.8, 31));
    }
    b.headGroup.position.y = 1.65 + (t > 37.8 ? Math.sin(t * 3) * 0.009 * (1 - anger * 0.8) : 0);
    b.bear.updateMatrixWorld(true);
    held.copy(rightPaw); b.rightArm.localToWorld(held);
    const groundHoney = v3(0.12, -3.19, 0.65);
    honey.position.copy(groundHoney).lerp(held, ease(t, 11.2, 12.1));
    honey.rotation.set(mix(-Math.PI / 2, 0, ease(t, 11.2, 12.1)), Math.PI * approach, -0.15);
    const receive = v3(-0.57, 2.4, -2.57);
    const transfer = ease(t, 27.8, 29.2);
    honey.position.lerp(receive, transfer);
    honey.rotation.y = mix(honey.rotation.y, 0, transfer);
    if (t >= 29.2) honey.position.copy(receive).lerp(v3(-0.68, 2.36, -2.85), ease(t, 29.2, 30));

    rabbits.forEach((r, i) => {
      const laugh = t < 1.6 ? (1 - ease(t, 0.5, 1.6)) * Math.max(0, Math.sin(t * 10 + i)) : 0;
      const exchange = ease(t, 1.5, 2.2) * (1 - ease(t, 3.2, 4));
      r.headGroup.rotation.set(0.35, (i % 2 ? -1 : 1) * exchange * 0.9, 0);
      r.headGroup.position.y = 1.15 + laugh * 0.09;
      r.jaw.rotation.x = laugh * 0.5;
      r.mouth.scale.y = 0.45 + laugh * 0.8;
      r.teethGroup.visible = laugh > 0.2 || t >= 30;
      r.leftEar.rotation.z = 0.1 + exchange * 0.2;
      r.rightEar.rotation.z = -0.1 - exchange * 0.2;
      const blink = (t + i * 0.7) % 4.7 < 0.1;
      r.leftEye.visible = r.rightEye.visible = !blink;
      r.leftEyeLine.visible = r.rightEyeLine.visible = blink;
      r.rabbit.updateMatrixWorld(true);
      r.arms.forEach(({ arm, paw, finger, side }) => {
        const shoulder = r.rabbit.localToWorld(v3(side * 0.35, 0.82, 0));
        let target = r.rabbit.localToWorld(v3(side * 0.43, 0.4, 0.2));
        const pointing = ease(t, 4, 4.7) * (1 - ease(t, 6.5, 7));
        target.lerp(shoulder.clone().add(v3(0, -0.48, 0.55)), pointing);
        if (i < 2 && t >= 13 && t < 31.3) {
          const anchor = v3(i === 0 ? -0.52 : 0.52, 2.35, -2.68);
          target.lerp(anchor, ease(t, 13, 13.6));
          if (i === 0 && side === 1 && t >= 23) {
            // An open paw demands payment, then closes around the actual prop.
            target.lerp(v3(-0.45, 2.12, -2.3), ease(t, 23, 24));
            target.lerp(honey.position, ease(t, 27.7, 28.8));
          }
        }
        if (i === 0 && side === 1 && t >= 29) target.copy(honey.position);
        if (t >= 31.3 && !(i === 0 && side === 1)) target.copy(shoulder).add(v3(side * 0.35, 0.28, 0.3));
        segment(arm, shoulder, target); paw.position.copy(target);
        finger.visible = pointing > 0.5;
        segment(finger, target, target.clone().add(v3(0, -0.23, 0.13)));
      });
    });

    // The ladder unrolls, hangs under tension, then each rung collapses onto the floor.
    const deploy = ease(t, 13.7, 16);
    const release = p(t, 31.5, 33.4);
    const ladderPoint = (side, k) => {
      const u = k / 15;
      const y = 2.35 - u * 5.48 * deploy;
      const z = -2.68 + Math.sin(u * Math.PI) * 0.10 * Math.sin(t * 3);
      const a = v3(side * 0.52, y, z);
      if (t >= 31.5) {
        const d = Math.max(0, release * 1.4 - u * 0.2);
        a.y = Math.max(-3.25 + 0.025 * Math.sin(k * 3), y - 7.5 * d * d);
        a.z += ease(t, 31.5, 33.6) * (0.5 + u * 2.15);
        a.x += Math.sin(k * 1.7) * 0.2 * ease(t, 32.5, 33.8);
      }
      return a;
    };
    ropes.forEach((rope, j) => rope.forEach((m, k) => {
      m.visible = t >= 13.3; segment(m, ladderPoint(j ? 1 : -1, k), ladderPoint(j ? 1 : -1, k + 1));
    }));
    rungs.forEach((m, k) => { m.name = `ladder-rung-${k}`; m.visible = t >= 13.3; segment(m, ladderPoint(-1, k + 1), ladderPoint(1, k + 1)); });
    dust.forEach((m, i) => {
      const q = p(t, 33.05, 35.1); m.visible = t >= 33.05 && t < 35.1;
      m.position.set(Math.cos(m.userData.phase) * q * 1.8, -3.2 + Math.sin(q * Math.PI) * (0.4 + i % 3 * 0.15), -0.1 + Math.sin(m.userData.phase) * q * 1.5);
      m.scale.setScalar(1 + q * 4); m.material.opacity = (1 - q) * 0.4;
    });
    brows.forEach((m, i) => {
      const side = i ? 1 : -1;
      segment(m, v3(side * 0.06, mix(0.23, 0.105, anger), 0.48), v3(side * 0.29, mix(0.25, 0.23, anger), 0.425));
    });
    eyes.forEach(m => { m.scale.y = mix(1, 0.45, anger); });
    mouth.visible = t >= 35 || reaction;
    mouth.scale.x = mix(0.7, 1.15, anger);
    creases.forEach((m, i) => {
      m.visible = anger > 0.01;
      const side = i % 2 ? 1 : -1, row = Math.floor(i / 2);
      segment(m, v3(side * 0.025, 0.19 + row * 0.075, 0.477 - row * 0.024), v3(side * (0.105 + row * 0.022), 0.24 + row * 0.065, 0.465 - row * 0.028));
      m.scale.x = m.scale.z = anger;
    });
    angerLight.intensity = 5 * anger;
    fill.intensity = mix(24, 12, anger);

    updateShot(HONEY_BETRAYAL_SHOTS, editorialTime, {
      shot, camera, b, t, editorialTime, climb, fall, mix, ease
    });
  }
  return { config: SCENE_CONFIG, update };
}
