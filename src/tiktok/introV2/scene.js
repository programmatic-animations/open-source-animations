import * as THREE from 'three';
import { createIntroScene } from '../intro/scene.js';
import { DURATION, LEAD_IN, DIALOGUE_DURATION, smooth, speechEnergy, dialogueActing } from '../intro/timing.js';
import { updateShot } from '../../runtime/shotTimeline.js';
import { SHOTS } from './shots.js';
import { createGraphics } from './graphics.js';

export const SCENE_CONFIG = {
  id: 'tiktok-intro-v2', title: 'Balu · made of code', duration: DURATION,
  shots: SHOTS, seekable: true
};
const gate = (t, a, b, fade = .2) => smooth((t - a) / fade) * (1 - smooth((t - b) / fade));

function createEffects(scene, actors) {
  const mint = new THREE.MeshBasicMaterial({ color: '#71ffdc', transparent: true, opacity: .7, wireframe: true });
  const wire = new THREE.Mesh(actors.body.geometry, mint);
  wire.scale.setScalar(1.008); actors.body.add(wire);
  const scan = new THREE.Mesh(new THREE.TorusGeometry(.64, .012, 8, 64),
    new THREE.MeshBasicMaterial({ color: '#a8ffe9', transparent: true, opacity: .8 }));
  scan.rotation.x = Math.PI / 2; scene.add(scan);
  const cubes = Array.from({ length: 32 }, (_, i) => {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(.04, .04, .04),
      new THREE.MeshBasicMaterial({ color: i % 3 ? '#7af3cf' : '#ffda63' }));
    scene.add(cube); return cube;
  });

  const capeGeometry = new THREE.PlaneGeometry(1, 1, 10, 12);
  const cape = new THREE.Mesh(capeGeometry, new THREE.MeshStandardMaterial({
    color: '#c63864', roughness: .7, side: THREE.DoubleSide
  }));
  actors.bear.add(cape);
  const rays = [];
  for (let i = 0; i < 14; i++) {
    const ray = new THREE.Mesh(new THREE.PlaneGeometry(.035, .46),
      new THREE.MeshBasicMaterial({ color: '#ffda63', transparent: true, opacity: .7, depthWrite: false }));
    scene.add(ray); rays.push(ray);
  }
  function update(time) {
    const code = gate(time, 9.3, 10.95) + gate(time, 13, 16.05);
    wire.visible = code > .001; wire.material.opacity = code * .68;
    scan.visible = code > .001;
    scan.position.set(actors.bear.position.x, .38 + ((time * .75) % .78), actors.bear.position.z);
    scan.material.opacity = code * .75;
    cubes.forEach((cube, i) => {
      cube.visible = code > .001;
      const cycle = (time * .55 + i * .173) % 1;
      cube.position.set((i % 2 ? 1 : -1) * (.6 + cycle * .48), .25 + (i % 6) * .15, -.3 + Math.sin(i) * .1);
      cube.rotation.set(time + i, time * .8, i);
      cube.scale.setScalar(code * (.45 + .65 * Math.sin(cycle * Math.PI)));
    });
    const hero = gate(time, 18.9, 23.3, .28);
    cape.visible = hero > .001;
    const positions = capeGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const row = Math.floor(i / 11) / 12, col = (i % 11) / 10 - .5;
      positions.setXYZ(i, col * (.53 + row * 1.35) * hero,
        1.39 - row * 1.31, -.34 - row * .22 + Math.sin(row * 7 + time * 5 + col * 4) * row * .14);
    }
    positions.needsUpdate = true; capeGeometry.computeVertexNormals();
    rays.forEach((ray, i) => {
      const angle = i / rays.length * Math.PI * 2;
      ray.visible = hero > .01;
      ray.position.set(Math.sin(angle) * (1.02 + hero * .12), 1.5 + Math.cos(angle) * 1.05, -.75);
      ray.rotation.z = -angle; ray.scale.y = hero; ray.material.opacity = hero * .7;
    });
  }
  return { update, wire, cape, scan, cubes, rays };
}

export function createIntroV2Scene({ scene, camera, renderer }) {
  const base = createIntroScene({ scene, camera, renderer });
  const { actors } = base;
  const { bear, body, headGroup, leftArm, rightArm, leftLeg, rightLeg, eyes, brows } = actors;
  const effects = createEffects(scene, actors);
  const graphics = createGraphics(scene, camera);

  function update(time) {
    base.update(time);
    const t = time - LEAD_IN;
    const active = time >= LEAD_IN && time < LEAD_IN + DIALOGUE_DURATION;
    const acting = dialogueActing(time);
    const energy = speechEnergy(time);
    const hello = gate(time, 2.04, 3.12, .14);
    const hopPhase = Math.max(0, Math.min(1, (time - 2.18) / .66));
    const hop = .19 * Math.sin(hopPhase * Math.PI);
    const land = gate(time, 2.82, 2.94, .10);
    const introduce = gate(time, 5.12, 8.85, .3);
    const explain = gate(time, 9.25, 10.9) + gate(time, 13, 16.05);
    const hero = gate(time, 18.9, 23.3, .28);
    const invite = gate(time, 23.6, 27.95, .25);
    const check = gate(time, 11.2, 12.8) + gate(time, 16.5, 18.1) + gate(time, 28.25, 29.7);
    const bye = gate(time, 31.65, 33.1, .18);

    bear.position.set(active ? .085 * Math.sin(t * 1.7) * (introduce + explain * .6 + invite * .6) : 0, hop, 0);
    bear.rotation.set(0, active ? .025 * Math.sin(t * 1.2) : 0, active ? .018 * Math.sin(t * 2) : 0);
    body.scale.set(.9 + land * .055 + hero * .065, 1.2 - land * .10 + hero * .065 + .009 * Math.sin(time * 2), .75);
    headGroup.position.set(0, 1.65 - land * .075 + hero * .035, 0);
    headGroup.rotation.x += check * .024 - hero * .035 + energy * .017;
    headGroup.rotation.z += .045 * check;
    leftLeg.rotation.set(.08 * introduce * Math.sin(time * 6), 0, -.04 * hero);
    rightLeg.rotation.set(-.08 * introduce * Math.sin(time * 6), 0, .04 * hero);
    leftArm.rotation.set(-.16 - .42 * (hello + bye) - .55 * explain - .3 * invite,
      0, -.26 - .50 * hello - .44 * bye - .17 * Math.sin(time * 12) * (hello + bye)
      - .38 * explain - .36 * hero - .2 * invite);
    rightArm.rotation.set(-.18 - 1.0 * introduce - .5 * explain - .37 * invite,
      -.14 * introduce, .26 + .28 * explain + .44 * hero + .13 * invite);
    // Questioning palms stay at waist height, never in the face.
    leftArm.rotation.x -= check * .55;
    rightArm.rotation.x -= check * .55;
    leftArm.rotation.z -= check * .28; rightArm.rotation.z += check * .28;
    if (time >= 25.9 && time < 28.2) {
      rightArm.rotation.x = -.15;
      rightArm.rotation.z = .18 + .12 * Math.sin((time - 25.9) * 7);
    }

    eyes.forEach((eye, i) => {
      eye.scale.y *= 1 + .28 * hello + .16 * check - .11 * hero - .1 * bye;
      eye.scale.x *= 1 + .08 * hello;
      eye.position.x = (i ? .17 : -.17) + .006 * check;
    });
    brows.forEach((brow, i) => {
      brow.position.y += .035 * hello + .018 * energy + (i ? -.007 : .045) * check;
      brow.rotation.z += (i ? 1 : -1) * (.08 * hero - .12 * hello) + (i ? -.08 : -.14) * check;
    });
    if (!active) {
      // Clean edit handles: subtle breath only, no text, effects or large gestures.
      headGroup.rotation.set(.006 * Math.sin(time * 1.3), 0, 0);
      leftArm.rotation.set(-.12, 0, -.26); rightArm.rotation.set(-.12, 0, .26);
      leftLeg.rotation.set(0, 0, 0); rightLeg.rotation.set(0, 0, 0);
    }
    updateShot(SHOTS, time, { camera });
    effects.update(time); graphics.update(time);
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
  }
  update(0);
  return { config: SCENE_CONFIG, update, actors, effects, graphics };
}
