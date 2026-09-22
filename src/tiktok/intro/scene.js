import * as THREE from 'three';
import { createBear } from '../../characters/bear.js';
import { createGround } from '../../environment/ground.js';
import { updateShot } from '../../runtime/shotTimeline.js';
import { SHOTS } from './shots.js';
import { DURATION, speechEnergy, phraseActing, dialogueActing } from './timing.js';

export const SCENE_CONFIG = {
  id: 'tiktok-intro-main', title: 'Balu says hello', duration: DURATION, shots: SHOTS,
  seekable: true
};

function createForest(scene) {
  scene.background = new THREE.Color('#a2b5a3');
  scene.fog = new THREE.Fog('#a2b5a3', 8, 22);
  scene.add(new THREE.HemisphereLight('#fff4dc', '#46613d', 2.5));
  const key = new THREE.DirectionalLight('#ffe2b0', 3.2);
  key.position.set(-3, 6, 5); scene.add(key);
  const fill = new THREE.DirectionalLight('#dceeff', 1.3);
  fill.position.set(4, 3, 4); scene.add(fill);
  const rim = new THREE.DirectionalLight('#fff4cd', 2.5);
  rim.position.set(1, 4, -4); scene.add(rim);
  const ground = createGround({ size: 70, color: '#68845c' });
  ground.position.y = -.06; scene.add(ground);

  const bark = new THREE.MeshStandardMaterial({ color: '#6a614a', roughness: 1 });
  const leaves = ['#587955', '#66815a', '#748b62'].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  for (let i = 0; i < 24; i++) {
    const x = (i % 8 - 3.5) * 2.25 + Math.sin(i * 4) * .45;
    const z = -4 - Math.floor(i / 8) * 4.2;
    const height = 4.6 + Math.sin(i * 2.3) * .8;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.16, .26, height, 9), bark);
    trunk.position.set(x, height / 2, z); scene.add(trunk);
    for (let layer = 0; layer < 3; layer++) {
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25 - layer * .15, 1), leaves[(i + layer) % 3]);
      crown.position.set(x + Math.sin(i + layer) * .38, height - .65 + layer * .65, z);
      crown.scale.set(1.1, .85, 1); scene.add(crown);
    }
  }
  // Layered contact shadow is geometry, so it stays deterministic in exports.
  for (let i = 0; i < 16; i++) {
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(.45 + i * .031, 48),
      new THREE.MeshBasicMaterial({ color: '#243426', transparent: true, opacity: .025, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -.047 + i * .0003, 0);
    shadow.scale.y = .63; scene.add(shadow);
  }
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#87917b', roughness: 1 });
  for (let i = 0; i < 11; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.13 + (i % 3) * .08, 0), stoneMat);
    rock.position.set((i % 2 ? -1 : 1) * (1.4 + i * .18), .01, -1.4 - (i % 4));
    rock.scale.y = .5; rock.rotation.y = i; scene.add(rock);
  }
}

export function createIntroScene({ scene, camera }) {
  createForest(scene);
  const actors = createBear({ position: { x: 0, y: 0, z: 0 } });
  const { bear, body, headGroup, leftArm, rightArm } = actors;
  scene.add(bear);
  const eyes = headGroup.children.filter(node => Math.abs(Math.abs(node.position.x) - .17) < .001 && node.position.y === .1);
  // Local additions keep the shared episode bear unchanged.
  const browMaterial = new THREE.MeshStandardMaterial({ color: '#392819', roughness: .85 });
  const brows = [-1, 1].map(side => {
    const group = new THREE.Group();
    group.position.set(side * .17, .205, .445);
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-.071, 0, 0), new THREE.Vector3(0, .036, .016),
      new THREE.Vector3(.071, 0, 0));
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, .018, 8, false), browMaterial));
    headGroup.add(group); return group;
  });
  for (const eye of eyes) {
    const glint = new THREE.Mesh(new THREE.SphereGeometry(.011, 10, 8),
      new THREE.MeshBasicMaterial({ color: '#fff4df' }));
    glint.position.set(-.016, .016, .044); eye.add(glint);
  }
  function update(time) {
    const energy = speechEnergy(time);
    const gesture = phraseActing(time);
    const acting = dialogueActing(time);
    const breath = Math.sin(time * 1.6);
    bear.position.set(.012 * Math.sin(time * .8), .008 * breath, 0);
    bear.rotation.set(0, .012 * Math.sin(time * .7), gesture.lean * .4);
    body.scale.set(.9 + .018 * acting.hero, 1.2 + .006 * breath + .015 * acting.hero, .75);
    headGroup.rotation.set(gesture.nod + acting.nod - .018 * acting.hero + .018 * acting.attention + .008 * Math.sin(time * 1.3),
      .018 * Math.sin(time * .65), .012 * Math.sin(time * .95) + .025 * acting.question);
    const open = .12 * acting.explaining + .17 * acting.invitation;
    leftArm.rotation.set(-.12 - gesture.left * .4 - energy * .07 - .35 * (acting.greeting + acting.farewell),
      0, -.22 - gesture.left * .45 - open - .18 * acting.wave);
    rightArm.rotation.set(-.12 - gesture.right * .4 - energy * .07 - .85 * acting.introduction,
      -.16 * acting.introduction, .22 + gesture.right * .45 + open + .08 * acting.hero);
    // Natural blinks, always derived from absolute time for repeatable scrubbing.
    const blinkPhase = ((time + .6) % 4.7);
    const blink = Math.max(0, 1 - Math.abs(blinkPhase - .11) / .11);
    const alert = .2 * acting.attention + .11 * acting.greeting;
    const soft = .13 * acting.farewell + .055 * acting.hero;
    eyes.forEach((eye, i) => {
      eye.scale.y = (1 + alert - soft + .055 * acting.question * (i ? -1 : 1)) * (1 - .94 * blink);
      eye.scale.x = 1 + .065 * acting.attention;
    });
    brows.forEach((brow, i) => {
      const side = i === 0 ? -1 : 1;
      brow.position.y = .205 + .047 * acting.attention + .022 * acting.greeting
        + .012 * energy * acting.explaining + (i === 0 ? .052 : .006) * acting.question
        + .018 * acting.invitation + .012 * acting.farewell;
      brow.rotation.z = side * (.045 + .11 * acting.hero - .16 * acting.invitation - .08 * acting.farewell)
        + (i === 0 ? -.12 : .06) * acting.question;
      brow.scale.y = 1 + .3 * acting.greeting + .24 * acting.farewell;
    });
    updateShot(SHOTS, time, { camera });
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
  }
  update(0);
  return { config: SCENE_CONFIG, update, actors: { ...actors, eyes, brows } };
}
