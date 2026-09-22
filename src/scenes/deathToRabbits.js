import * as THREE from 'three';
import { createHoneyBetrayalScene } from './honeyBetrayal.js';
import { createHorrorHand } from '../characters/horrorHands.js';
import { createRabbitActing } from '../characters/rabbitActing.js';
import { createHorrorForest } from '../environment/horrorForest.js';
import { DEATH_TO_RABBITS_SHOTS as SHOTS, HORROR_CUES as C, horrorStoryTime } from '../shots/deathToRabbitsShots.js';
import { updateShot } from '../runtime/shotTimeline.js';

export const SCENE_CONFIG = { id: 'death-to-rabbits', title: 'DEA*H to the RABBITS', duration: SHOTS.at(-1).end, shots: SHOTS };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (t, a, b) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
const ease = (t, a, b) => { const x = clamp(t, a, b); return x * x * (3 - 2 * x); };
const mix = THREE.MathUtils.lerp;
const UP = V(0, 1, 0);
const ESCAPE_DIRECTIONS = [V(), V(-0.12, 0, -1).normalize(), V(-0.56, 0, -1).normalize(), V(0.62, 0, -1).normalize()];

export function createDeathToRabbitsScene({ scene, camera }) {
  // Freeze the approved last frame as the physical starting world. No Episode 2 poses change.
  const previous = createHoneyBetrayalScene({ scene, camera }); previous.update(47);
  const { b, rabbits, honey, branch, mouth, eyes, ambient, sun, fill, angerLight } = previous.actors;
  scene.updateMatrixWorld(true);
  const rest = [];
  scene.traverse(object => rest.push({ object, position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone(), visible: object.visible }));
  const originalBackground = scene.background.clone();
  const originalAmbient = ambient.color.clone(), originalSun = sun.color.clone();
  const originalBranch = branch.position.clone(), originalBranchQ = branch.quaternion.clone();
  const originalHoney = honey.position.clone();
  const rim = scene.children.find(o => o.isMesh && o.geometry.type === 'RingGeometry');
  rim.geometry.dispose(); rim.geometry = new THREE.RingGeometry(3.24, 100, 96);
  const backdrop = scene.children.find(o => o.isMesh && o.material.map);
  const terrain = scene.children.filter(o => o.isMesh && (
    ['CircleGeometry', 'RingGeometry'].includes(o.geometry.type) ||
    (o.geometry.type === 'CylinderGeometry' && o.geometry.parameters.radiusTop > 2)))
    .map(o => ({ material: o.material, color: o.material.color.clone() }));
  const clearPaths = rabbits.slice(1).map((rabbit, i) => ({
    origin: rabbit.rabbit.position.clone().add(V(0, 0, -0.16 - (i + 1) * 0.06)), direction: ESCAPE_DIRECTIONS[i + 1]
  }));
  const forest = createHorrorForest({ clearPaths }); scene.add(forest);
  scene.fog = new THREE.FogExp2(0x151f29, 0);
  const hands = [createHorrorHand(b.leftArm, -1), createHorrorHand(b.rightArm, 1)];
  rabbits.forEach((r, i) => { r.rabbit.name = `horror-rabbit-${i}`; });
  const rabbitActing = rabbits.map(createRabbitActing);
  branch.name = 'horror-spear';
  const victim = rabbits[0];
  const headOrigin = victim.headGroup.getWorldPosition(V());
  const headRotation = victim.headGroup.getWorldQuaternion(new THREE.Quaternion());
  const headScale = victim.headGroup.getWorldScale(V());
  const target = headOrigin.clone().add(V(0, -0.05, 0.34));
  const red = new THREE.MeshStandardMaterial({ color: 0x800a13, roughness: 0.32 });
  const bone = new THREE.MeshStandardMaterial({ color: 0xd7c49e, roughness: 0.75 });
  const black = new THREE.MeshStandardMaterial({ color: 0x140609, roughness: 0.85, side: THREE.DoubleSide });
  function mesh(geometry, material, parent = scene) {
    const object = new THREE.Mesh(geometry, material); parent.add(object); return object;
  }
  const neck = mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.10, 16), red, victim.rabbit);
  neck.position.set(0, 0.94, 0); neck.name = 'horror-neck';
  const stump = mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.13, 9), bone, neck);
  stump.position.y = 0.025;
  const wound = mesh(new THREE.SphereGeometry(0.13, 16, 10), red, victim.headGroup);
  wound.position.set(0, -0.05, 0.41); wound.scale.set(0.85, 1, 0.28);
  const pool = mesh(new THREE.CircleGeometry(0.65, 40), red);
  pool.rotation.x = -Math.PI / 2; pool.position.set(-0.68, -3.365, -1.3); pool.name = 'horror-blood-pool';
  const droplets = Array.from({ length: 96 }, (_, i) => {
    const d = mesh(new THREE.SphereGeometry(0.018 + (i % 4) * 0.008, 6, 4), red);
    d.name = `horror-blood-${i}`; return d;
  });
  // Curved grin surface and tapered teeth live in front of the existing muzzle.
  const smile = new THREE.Group(); smile.name = 'horror-smile'; b.headGroup.add(smile);
  smile.position.set(0, -0.255, 0.591);
  const shape = new THREE.Shape();
  shape.moveTo(-0.23, 0.075); shape.quadraticCurveTo(0, -0.015, 0.23, 0.075);
  shape.quadraticCurveTo(0.19, -0.17, 0, -0.17); shape.quadraticCurveTo(-0.19, -0.17, -0.23, 0.075);
  const smileCavity = mesh(new THREE.ShapeGeometry(shape, 28), black, smile);
  const lowerJaw = new THREE.Group(); smile.add(lowerJaw);
  for (let i = 0; i < 9; i++) {
    const x = (i - 4) * 0.046;
    const tooth = mesh(new THREE.ConeGeometry(0.025, i === 1 || i === 7 ? 0.12 : 0.08, 3), bone, smile);
    tooth.position.set(x, 0.004 + 0.055 * Math.pow(x / 0.2, 2) - 0.03, 0.012);
    tooth.rotation.z = Math.PI; tooth.scale.z = 0.42;
    if (i > 1 && i < 7) {
      const lower = mesh(new THREE.ConeGeometry(0.021, 0.062, 3), bone, lowerJaw);
      lower.position.set(x, -0.122 + 0.055 * Math.pow(x / 0.2, 2), 0.014); lower.scale.z = 0.4;
    }
  }
  const flames = [];
  const glow = new THREE.MeshBasicMaterial({ color: 0xff661b, transparent: true, depthWrite: false });
  for (const side of [-1, 1]) {
    const core = mesh(new THREE.SphereGeometry(0.049, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffc35c }), b.headGroup);
    core.position.set(side * 0.17, 0.10, 0.482); core.scale.set(1, 0.47, 0.4);
    flames.push({ object: core, phase: 0, core: true });
    for (let i = 0; i < 4; i++) {
      const flame = mesh(new THREE.ConeGeometry(0.01, 0.055, 8), glow, b.headGroup);
      flame.position.set(side * 0.17 + (i - 1.5) * 0.016, 0.118, 0.483);
      flames.push({ object: flame, phase: i * 2 + side, core: false });
    }
  }
  const eyeLight = new THREE.PointLight(0xff3b12, 0, 1.7, 2);
  eyeLight.position.set(0, 0.12, 0.65); b.headGroup.add(eyeLight);
  const rimLight = new THREE.DirectionalLight(0x839eae, 0);
  rimLight.position.set(-2, 4, -3); scene.add(rimLight);
  const sclera = rabbits.map(rabbit => [-1, 1].map(side => {
    const white = mesh(new THREE.SphereGeometry(0.10, 16, 10), new THREE.MeshStandardMaterial({ color: 0xd7dddb, roughness: 0.8 }), rabbit.headGroup);
    white.position.set(side * 0.15, 0.08, 0.375); white.scale.z = 0.45; return white;
  }));

  function reset() {
    rest.forEach(({ object, position, quaternion, scale, visible }) => {
      object.position.copy(position); object.quaternion.copy(quaternion); object.scale.copy(scale); object.visible = visible;
    });
  }
  function poseBear(t) {
    const look = ease(t, 2.15, 3.6);
    const inspect = ease(t, 3.1, 4.5) * (1 - ease(t, 9.6, 10.5));
    const bend = ease(t, 10, 11.7) * (1 - ease(t, 12.15, 13.6));
    const turn = ease(t, 12.8, 14);
    const wind = ease(t, 17, 18.3), throwArm = ease(t, 18.3, 20.6);
    const recover = ease(t, 20, 21.5);
    b.bear.position.set(0, -3.36 - bend * 0.03, -0.1);
    b.bear.rotation.set(bend * 0.12 + throwArm * (1 - recover) * 0.15, Math.PI * turn, -bend * 0.4);
    b.headGroup.rotation.set(mix(0.11, 0.62, look) - ease(t, 12.8, 14.7) * 0.98 + ease(t, 32, 33.4) * 0.22, 0, 0);
    b.leftLeg.rotation.x = b.rightLeg.rotation.x = bend * 0.45;
    b.leftArm.rotation.set(-inspect * 1.08, 0, -0.18 - inspect * 0.12);
    b.rightArm.rotation.set(-inspect * 1.08 - bend * 0.18, 0, 0.18 + inspect * 0.12 + bend * 0.12);
    if (t >= 12.2) b.rightArm.rotation.x = -ease(t, 12.2, 13.7) * 1.15 - wind * 1.95 + throwArm * 2.55;
    const shake = ease(t, 4.5, 5.4) * (1 - ease(t, 8, 9.25));
    b.leftArm.rotation.z += Math.sin(t * 47) * 0.027 * shake;
    b.rightArm.rotation.z += Math.sin(t * 53 + 1) * 0.035 * shake;
    b.leftArm.rotation.x += Math.sin(t * 43) * 0.025 * shake;
    b.rightArm.rotation.x += Math.sin(t * 49) * 0.029 * shake;
    const point = ease(t, 28.6, 29.5) * (1 - ease(t, 31.6, 32.7));
    b.leftArm.rotation.x -= point * 2.28;
    b.leftArm.rotation.z += point * 0.1;
    // Reach toward the branch, then lift continuously into the original carrying pose.
    if (t > 10.4 && t < 13.7) {
      b.bear.updateMatrixWorld(true);
      const reach = V(1.1 - 0.52 * ease(t, 12, 13.6), -3.08 + 0.85 * ease(t, 11.8, 13.5), 0.05 + 0.45 * ease(t, 12, 13.3));
      b.bear.worldToLocal(reach).sub(b.rightArm.position).normalize();
      const aim = new THREE.Quaternion().setFromUnitVectors(V(0, -1, 0), reach);
      b.rightArm.quaternion.slerp(aim, ease(t, 10.4, 11.6) * (1 - ease(t, 13.1, 13.7)));
    }
    b.bear.updateMatrixWorld(true);
  }
  reset(); poseBear(C.release);
  const release = b.rightArm.localToWorld(V(0, -0.79, 0.04));
  const spearDirection = target.clone().sub(release).normalize();
  const spearRotation = new THREE.Quaternion().setFromUnitVectors(UP, spearDirection);
  function bodyAt(t) {
    const fall = clamp(t, C.fall, C.land);
    return V(-0.68, mix(1.64, -3.12, fall * fall), mix(-3.28, -1.28, ease(t, C.fall, C.land)));
  }
  function segment(object, a, z) {
    object.position.copy(a).add(z).multiplyScalar(0.5);
    object.scale.y = a.distanceTo(z);
    object.quaternion.setFromUnitVectors(UP, z.clone().sub(a).normalize());
  }
  function frame(position, targetPosition, fov) {
    camera.position.set(...position); camera.lookAt(...targetPosition); camera.fov = fov; camera.updateProjectionMatrix();
  }
  function update(rawTime) {
    const editorialTime = THREE.MathUtils.clamp(rawTime, 0, SCENE_CONFIG.duration);
    const t = horrorStoryTime(editorialTime);
    reset();
    // Exact two-second match cut, followed by a gradual draining of warm daylight.
    const mood = ease(t, 2, 5.5);
    scene.background.copy(originalBackground).lerp(new THREE.Color(0x151f29), mood);
    ambient.color.copy(originalAmbient).lerp(new THREE.Color(0x819eae), mood);
    ambient.intensity = mix(1.7, 0.65, mood);
    sun.color.copy(originalSun).lerp(new THREE.Color(0x9fb8c6), mood); sun.intensity = mix(3, 0.85, mood);
    fill.intensity = mix(12, 6, mood); angerLight.intensity = mix(5, 0.6, mood); rimLight.intensity = mood * 1.1;
    backdrop.visible = mood < 0.5; forest.visible = mood >= 0.5;
    scene.fog.density = mood * mix(0.045, 0.028, ease(editorialTime, 35.2, 37));
    terrain.forEach(({ material, color }) => material.color.copy(color).lerp(new THREE.Color(0x303038), mood * 0.8));
    if (t > 2) poseBear(t);
    const growth = ease(t, C.fingers, C.fingers + 0.16);
    const curl = ease(t, 8.1, 8.9) * (1 - ease(t, 9.15, 9.7));
    const tension = ease(t, 5.4, 7.1) * (0.85 + Math.sin(t * 32) * 0.15) * (1 - growth);
    const airborne = ease(t, 12.9, 13.1) * (1 - ease(t, 13.65, 13.9));
    hands.forEach((hand, i) => hand.update(growth, i === 1 && t >= C.grip && t < C.release ? 0.9 * (1 - airborne) : t >= 28.5 && i === 0 ? 0.95 : curl, i === 0 && t >= 28.5, tension));
    const heat = ease(t, 14, 15.3);
    flames.forEach(({ object, phase, core }) => {
      object.visible = heat > 0;
      if (!core) { object.scale.set(heat, heat * (0.65 + Math.sin(t * 15 + phase) * 0.25), heat); object.rotation.z = Math.sin(t * 9 + phase) * 0.2; }
    });
    eyeLight.intensity = heat * 0.10;
    eyes.forEach(eye => { eye.visible = heat < 0.9; });
    const grin = ease(t, C.smile, 36.4);
    smile.visible = grin > 0; smile.scale.set(0.65 + grin * 0.35, Math.max(0.001, grin), 1);
    mouth.visible = grin < 0.05;
    // A held, breath-driven chuckle after the grin: rigid teeth, moving lower jaw.
    const laughTime = Math.max(0, t - C.laugh);
    const laughEnvelope = ease(t, C.laugh, C.laugh + 0.5) * (1 - ease(t, 39.5, 40));
    const chuckle = Math.pow(Math.max(0, Math.sin(laughTime * Math.PI * 4.6)), 2) * laughEnvelope;
    smileCavity.scale.y = 1 + chuckle * 0.11;
    lowerJaw.position.y = -chuckle * 0.018;
    if (chuckle > 0) {
      b.bear.position.y += chuckle * 0.012;
      b.bear.rotation.x -= chuckle * 0.009;
      b.headGroup.rotation.x += chuckle * 0.022;
      b.leftArm.position.y += chuckle * 0.017;
      b.rightArm.position.y += chuckle * 0.017;
    }
    b.bear.updateMatrixWorld(true);
    const grip = b.rightArm.localToWorld(V(0, -0.79, 0.04));
    branch.position.copy(originalBranch); branch.quaternion.copy(originalBranchQ);
    if (t >= 11.8 && t < C.release) {
      branch.position.lerp(grip, ease(t, 11.8, 12.3));
      const lift = new THREE.Quaternion().setFromUnitVectors(UP, V(-0.85, 0.15, 0.35).normalize());
      lift.slerp(spearRotation, ease(t, 17, 18.6)); branch.quaternion.slerp(lift, ease(t, 11.8, 13));
      // One controlled turn after the branch clears the floor.
      const roll = ease(t, 12.9, 13.9);
      const flourish = new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), Math.PI * 2 * roll);
      branch.quaternion.premultiply(flourish);
      branch.position.y += 0.1 * Math.sin(roll * Math.PI);
    } else if (t >= C.release) {
      const hitCenter = target.clone().addScaledVector(spearDirection, -0.85);
      branch.position.copy(release).lerp(hitCenter, clamp(t, C.release, C.impact)); branch.quaternion.copy(spearRotation);
      if (t > C.impact) {
        const dt = Math.min(t - C.impact, 2);
        branch.position.addScaledVector(spearDirection, dt * 2.2); branch.position.y -= dt * dt * 1.8;
      }
    }
    // Geometric clearance protects both ends throughout the rotating pickup.
    if (t > 2 && t < C.release) {
      const axis = UP.clone().applyQuaternion(branch.quaternion);
      const extent = 0.85 * Math.abs(axis.y) + 0.13 * Math.sqrt(1 - axis.y * axis.y);
      branch.position.y = Math.max(branch.position.y, -3.38 + extent + 0.015);
    }
    const severed = t >= C.impact;
    neck.visible = wound.visible = severed;
    victim.rabbit.position.copy(bodyAt(t));
    const collapse = ease(t, C.fall, C.land);
    victim.rabbit.rotation.set(-collapse * 1.4, 0, collapse * 0.25);
    victim.rabbit.updateMatrixWorld(true);
    if (severed) {
      const dt = Math.min(t - C.impact, 2);
      const flyingHead = headOrigin.clone().addScaledVector(spearDirection, dt * 2.2);
      flyingHead.y -= dt * dt * 1.8;
      victim.headGroup.position.copy(victim.rabbit.worldToLocal(flyingHead));
      const rotation = headRotation.clone();
      victim.headGroup.quaternion.copy(victim.rabbit.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rotation));
      victim.headGroup.scale.copy(headScale);
      victim.headGroup.visible = t < 21.9;
      branch.visible = t < 21.9;
    }
    // Both paws hold the comb during the lifeless fall; all three share one body transform.
    const honeyHeld = victim.rabbit.localToWorld(V(0, 0.73, 0.42));
    honey.position.copy(originalHoney).lerp(honeyHeld, ease(t, 18, 19.4));
    if (t >= 18) honey.quaternion.copy(victim.rabbit.quaternion);
    rabbits.forEach((rabbit, i) => {
      const fear = ease(t, 19.7 + i * 0.08, 20.5 + i * 0.08);
      const skeptical = ease(editorialTime, 17.05 + i * 0.04, 17.5 + i * 0.04) * (1 - ease(editorialTime, 18.75, 19));
      const escapeTime = Math.max(0, editorialTime - 34);
      const panic = i > 0 ? ease(escapeTime, 0, 0.45) : 0;
      const runTime = i > 0 ? Math.max(0, escapeTime - 1.55 - (i - 1) * 0.09) : 0;
      const running = ease(runTime, 0, 0.3);
      const phase = runTime * 24;
      rabbitActing[i].update({ skeptical, fear, running, phase, visible: i > 0 && editorialTime >= 34 });
      sclera[i].forEach(eye => { eye.visible = i > 0 && fear > 0.2; eye.scale.y = 1 + fear * 0.15; });
      if (i > 0) {
        rabbit.rabbit.position.z -= fear * (0.16 + i * 0.06);
        rabbit.headGroup.rotation.set(0.35 + fear * 0.08, fear * (i === 1 ? 0.32 : -0.14), fear * 0.05 * (i % 2 ? -1 : 1));
        rabbit.leftEar.rotation.z = 0.1 + fear * 0.45; rabbit.rightEar.rotation.z = -0.1 - fear * 0.45;
        rabbit.leftEye.scale.set(1 - fear * 0.32, 1 - fear * 0.2, 1); rabbit.rightEye.scale.copy(rabbit.leftEye.scale);
        rabbit.leftEye.position.z = rabbit.rightEye.position.z = 0.36 + fear * 0.055;
        rabbit.leftEye.visible = rabbit.rightEye.visible = true;
        rabbit.leftEyeLine.visible = rabbit.rightEyeLine.visible = false;
        rabbit.mouth.scale.y = mix(0.45, 1.15, fear); rabbit.jaw.rotation.x = 0;
        rabbit.jaw.position.z = mix(0.39, 0.51, fear); rabbit.jaw.position.y = mix(-0.24, -0.27, fear);
        rabbit.teethGroup.visible = fear < 0.4;
        if (panic > 0) {
          rabbit.mouth.scale.y = 1.15 + panic * 0.45;
          rabbit.jaw.position.y = -0.27 - panic * 0.02;
          const glance = ease(escapeTime, 0.55, 0.9) * (1 - ease(escapeTime, 1.2, 1.65));
          rabbit.headGroup.rotation.y = [0, -0.8, 0.8, -0.85][i] * glance;
          const direction = ESCAPE_DIRECTIONS[i];
          const turn = ease(escapeTime, 1.2 + i * 0.04, 1.75 + i * 0.04);
          rabbit.rabbit.rotation.y = Math.atan2(direction.x, direction.z) * turn;
          // Rapid acceleration and long strides, with only a little vertical movement.
          const distance = 10 * (runTime - 0.24 * (1 - Math.exp(-runTime / 0.24)));
          rabbit.rabbit.position.addScaledVector(direction, distance);
          rabbit.rabbit.position.y += running * Math.pow(Math.sin(phase), 2) * 0.045;
          rabbit.rabbit.rotation.x = running * 0.22;
          rabbit.headGroup.rotation.x = mix(rabbit.headGroup.rotation.x, -0.12, running);
          rabbit.leftEar.rotation.z += Math.sin(phase - 0.4) * running * 0.08;
          rabbit.rightEar.rotation.z += Math.sin(phase - 0.8) * running * 0.08;
        }
      }
      if (skeptical > 0) {
        const glance = ease(editorialTime, 17.7, 18.15) * (1 - ease(editorialTime, 18.4, 18.9));
        rabbit.headGroup.rotation.y = (i % 2 ? -1 : 1) * glance * 0.5;
        rabbit.headGroup.rotation.z = (i % 2 ? -1 : 1) * skeptical * 0.06;
        rabbit.leftEye.scale.y = 1 - skeptical * 0.15; rabbit.rightEye.scale.y = 1 - skeptical * 0.4;
        rabbit.mouth.scale.y = mix(0.45, 0.08, skeptical); rabbit.teethGroup.visible = false;
      }
      rabbit.rabbit.updateMatrixWorld(true);
      rabbit.arms.forEach(({ arm, paw, finger, side }) => {
        if (t <= 2) return;
        const shoulder = rabbit.rabbit.localToWorld(V(side * 0.35, 0.82, 0));
        let destination;
        if (i === 0) destination = honey.position.clone().add(V(side * 0.2, -0.025, 0.04));
        else destination = rabbit.rabbit.localToWorld(V(side * mix(0.6, 0.31, fear), mix(1.1, 1.22, fear), 0.38));
        if (i > 0 && running > 0) {
          const swing = Math.sin(phase + (side > 0 ? Math.PI : 0));
          const pump = rabbit.rabbit.localToWorld(V(side * 0.4, 0.63 + swing * 0.12, swing * 0.35));
          destination.lerp(pump, running);
        }
        segment(arm, shoulder, destination); paw.position.copy(destination); finger.visible = false;
      });
    });
    droplets.forEach((drop, i) => {
      const burst = i < 40;
      const birth = burst ? C.impact + (i % 8) * 0.014 : C.fall + (i - 40) * 0.035;
      const age = t - birth;
      drop.visible = age >= 0 && age < 1.2;
      if (!drop.visible) { drop.position.set(0, 0, 0); drop.scale.setScalar(1); return; }
      const angle = i * 2.39996;
      const origin = burst ? target.clone() : bodyAt(birth).add(V(0, 0.85, 0));
      drop.position.copy(origin).add(V(Math.cos(angle) * age * 1.1, age * (1.8 + i % 4 * 0.25) - 4.5 * age * age, Math.sin(angle) * age * 0.85));
      drop.scale.set(1, 1 + age * 3, 1);
      drop.visible = drop.position.y > -3.35;
    });
    pool.visible = t >= C.land; pool.scale.setScalar(0.1 + ease(t, C.land, 29) * 0.9);
    scene.updateMatrixWorld(true);
    updateShot(SHOTS, editorialTime, { frame, t, corpse: victim.rabbit.position });
  }
  update(0);
  return { config: SCENE_CONFIG, update, actors: { b, rabbits, honey, branch, hands, smile, rabbitActing } };
}
