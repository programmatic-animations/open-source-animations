import * as THREE from 'three';
import { createCharacterRig } from '../characters/rigs/createCharacterRig.js';
import { createNativeMouth, visemeAt } from '../characters/rigs/nativeMouth.js';
import { createSpeak } from '../characters/actions/shared/speak.js';
import { createFace, blinkAt } from '../tiktok/beYou/face.js';
import { defineShots } from '../runtime/shotTimeline.js';

export function createNativeMouthTest({ scene, camera, manifest }) {
  scene.background = new THREE.Color('#cadbd4');
  scene.add(new THREE.HemisphereLight('#fff4e4', '#758879', 2.2));
  const key = new THREE.DirectionalLight('#ffe8d1', 3); key.position.set(-3, 5, 5); scene.add(key);
  const rim = new THREE.DirectionalLight('#e5efff', 2); rim.position.set(3, 3, -2); scene.add(rim);
  const actors = Object.fromEntries(['balu', 'rabbit'].map(character => {
    const rig = createCharacterRig(character), face = createFace(rig), mouth = createNativeMouth(rig);
    scene.add(rig.root);
    const line = manifest.lines.find(entry => entry.character === character);
    return [character, { rig, face, mouth, speech: createSpeak({ mouth, cues: line.cues }) }];
  }));
  const shots = defineShots(manifest.lines.map((line, index) => ({
    id: line.id, title: `${line.speaker} · dialogue`,
    duration: (manifest.lines[index + 1]?.start ?? manifest.duration) - (index ? line.start : 0)
  })));
  const direction = new THREE.Vector3();
  function update(time, { lineId, view = 'front', emotion = 'neutral', intensity = 1, syncOffset = 0, autoView = false } = {}) {
    const line = lineId ? manifest.lines.find(entry => entry.id === lineId) :
      manifest.lines.findLast(entry => time >= entry.start) ?? manifest.lines[0];
    const local = lineId ? time : time - line.start;
    for (const [name, actor] of Object.entries(actors)) {
      actor.rig.root.visible = name === line.character;
      actor.rig.reset(); actor.face.update({ time: 0, confidence: .2 });
      actor.mouth.update(visemeAt([], 0));
    }
    const { rig, face, speech } = actors[line.character];
    const state = visemeAt(line.cues, local + syncOffset);
    const speaking = state.shape !== 'X';
    const pulse = Math.sin(local * 2.1) * .016 * Number(speaking);
    rig.setJoint('head', { y: Math.sin(local * .8) * .045, x: pulse });
    face.update({ time: local, confidence: emotion === 'friendly' ? .6 : .2,
      fear: emotion === 'worried' ? .55 : 0, question: line.character === 'balu' ? .25 : 0,
      blink: blinkAt(local, [1.65, 3.35]) });
    // Native surface controls own the mouth; the old expression jaw is hidden.
    if (rig.joints.jaw) rig.setJoint('jaw');
    const mouthState = speech.update(local + syncOffset, { emotion, intensity });
    const angle = autoView ? THREE.MathUtils.smoothstep(local, .7, line.duration - .5) * .52 : { front: 0, three: .58, side: 1.20 }[view];
    // Actual head/ear bounds, including the opt-in neck's world placement.
    // Full ears, little headroom, and the muzzle large enough to inspect.
    const centerY = rig.character === 'balu' ? 1.72 : 1.44;
    const distance = rig.character === 'balu' ? 2.55 : 3.1;
    direction.set(Math.sin(angle) * distance, centerY + .08, Math.cos(angle) * distance);
    camera.position.copy(direction); camera.fov = 32;
    // Narrow browser panels retain the export's horizontal coverage.
    camera.zoom = Math.min(1, camera.aspect / (1920/1080));
    camera.lookAt(0, centerY, .15); camera.updateProjectionMatrix();
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    return { line, localTime: local, ...mouthState };
  }
  return { config: { id: 'native-mouth-test', duration: manifest.duration, shots, seekable: true }, actors, update };
}
