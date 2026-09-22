import * as THREE from 'three';
import { createBear } from '../characters/bear.js';
import { createRabbit } from '../characters/rabbit.js';

export const SCENE_CONFIG = { id: 'bear-ep3-thumbnail', title: 'Episode 3 — Into the dark', kind: 'thumbnail' };

// A deterministic horror poster with canvas-rendered title lettering, built from the series' actual models.
export function createBearEp3Thumbnail({ scene, camera }) {
  scene.background = new THREE.Color('#02060b');
  camera.position.set(0, 4, 22);
  camera.lookAt(0, 4, 0);
  camera.fov = 34;
  camera.updateProjectionMatrix();
  const mesh = (geometry, material, parent = scene) => {
    const object = new THREE.Mesh(geometry, material); parent.add(object); return object;
  };
  const standard = color => new THREE.MeshStandardMaterial({ color, roughness: 1 });
  const rod = (a, b, radius, material) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const object = mesh(new THREE.CylinderGeometry(radius * 0.35, radius, start.distanceTo(end), 7), material);
    object.position.copy(start).add(end).multiplyScalar(0.5);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    return object;
  };
  // Canvas textures are procedural light and mist, never external imagery.
  function glowTexture(stops) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d'), gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    stops.forEach(([at, color]) => gradient.addColorStop(at, color));
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }
  const mist = glowTexture([[0, '#4c899b'], [0.35, '#24485c'], [1, '#02060b']]);
  const backdrop = mesh(new THREE.PlaneGeometry(42, 25), new THREE.MeshBasicMaterial({ map: mist }));
  backdrop.position.set(0, 3, -6);
  scene.add(new THREE.HemisphereLight(0x8ac9e9, 0x020304, 0.15));
  const rim = new THREE.DirectionalLight(0x529bc5, 3.5); rim.position.set(-5, 9, -4); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0x3b759b, 1.8); rim2.position.set(7, 5, -3); scene.add(rim2);
  const bear = createBear({ position: { x: 0, y: -5.7, z: -1 } }); scene.add(bear.bear);
  bear.bear.scale.set(8.6, 7, 7);
  bear.headGroup.rotation.x = 0.12;
  bear.headGroup.scale.setScalar(1.18);
  bear.leftArm.rotation.z = -0.12; bear.rightArm.rotation.z = 0.12;
  bear.bear.traverse(object => {
    if (object.isMesh) object.material = standard(0x010203);
  });
  const fire = glowTexture([[0, 'rgba(255,245,182,1)'], [0.12, 'rgba(255,164,35,0.95)'], [0.35, 'rgba(255,55,0,0.5)'], [1, 'rgba(255,20,0,0)']]);
  for (const side of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.083, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffe8a0 }), bear.headGroup);
    eye.position.set(side * 0.17, 0.105, 0.471); eye.scale.set(1.15, 0.43, 0.5); eye.rotation.z = side * 0.27;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: fire, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.position.copy(eye.position); halo.position.z += 0.025; halo.scale.set(0.54, 0.42, 1); bear.headGroup.add(halo);
    for (let i = 0; i < 5; i++) {
      const shape = new THREE.Shape();
      const height = 0.09 + (i % 3) * 0.035;
      shape.moveTo(-0.016, 0);
      shape.bezierCurveTo(-0.035, height * 0.4, 0.025, height * 0.55, 0.008, height);
      shape.bezierCurveTo(0.055, height * 0.45, 0.024, height * 0.2, 0.016, 0);
      const flame = mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffbd43 : 0xff6a0b, side: THREE.DoubleSide }), bear.headGroup);
      flame.position.set(side * 0.17 + (i - 2) * 0.026, 0.115 + (i % 2) * 0.008, 0.51 + i * 0.002);
      flame.rotation.z = -side * 0.25;
    }
    const light = new THREE.PointLight(0xff4400, 0.6, 2); light.position.set(side * 1.5, 6.9, 3.5); scene.add(light);
  }
  // Small survivors form a separate, readable foreground triangle.
  const rabbitLight = new THREE.PointLight(0xa6dcff, 34, 9, 2); rabbitLight.position.set(-1, 2, 6); scene.add(rabbitLight);
  const rabbitPositions = [[-1.35, -0.9, 4.5, -0.6], [0, -1.02, 5.2, Math.PI], [1.4, -0.83, 4.6, 0.7]];
  rabbitPositions.forEach(([x, y, z, turn], i) => {
    const r = createRabbit({ color: 0x7b919c, bellyColor: 0xa4b7bd }); scene.add(r.rabbit);
    r.rabbit.position.set(x + 1, y + 0.12, z); r.rabbit.scale.setScalar(0.72); r.rabbit.rotation.y = turn;
    r.headGroup.rotation.x = -0.22; r.headGroup.rotation.z = i === 0 ? -0.16 : 0.12;
    r.leftEar.rotation.z = 0.28; r.rightEar.rotation.z = -0.3;
    r.jaw.rotation.x = 0.3;
  });
  const treeMaterial = new THREE.MeshBasicMaterial({ color: 0x02070c });
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = side * (7 + i * 2.4), z = -3 - (i % 2) * 2;
      rod([x, -3, z], [x + side * 0.6, 12, z], 0.2 + i * 0.055, treeMaterial);
      for (let j = 0; j < 4; j++) {
        const y = 1.8 + j * 2.3 + Math.sin(i * 7 + j * 3) * 0.8, endX = x - side * (1.3 + (j % 2) * 0.9);
        rod([x, y, z], [endX, y + 1.8, z], 0.085, treeMaterial);
        rod([endX, y + 1.8, z], [endX + side * 0.15, y + 2.8, z], 0.035, treeMaterial);
      }
    }
  }
  const fogTexture = glowTexture([[0, 'rgba(102,169,191,0.28)'], [0.4, 'rgba(68,126,151,0.12)'], [1, 'rgba(23,51,68,0)']]);
  for (let i = 0; i < 9; i++) {
    const fog = mesh(new THREE.PlaneGeometry(12, 1.4), new THREE.MeshBasicMaterial({ map: fogTexture, transparent: true, depthWrite: false }));
    fog.position.set(Math.sin(i * 4.1) * 7, -1.3 + i * 0.13, 6 + i * 0.06);
  }
  const ground = mesh(new THREE.PlaneGeometry(60, 50), standard(0x03090e)); ground.rotation.x = -Math.PI / 2; ground.position.y = -1.1;
  // Sparse foreground grass anchors the rabbits without competing with their ears.
  for (let i = 0; i < 75; i++) {
    const x = Math.sin(i * 19.3) * 12, z = 5 + (i % 7) * 0.25;
    rod([x, -1.1, z], [x + Math.sin(i) * 0.12, -0.9 + (i % 4) * 0.07, z], 0.013, treeMaterial);
  }
  // Shift the complete lit tableau left; foreground perspective is compensated above.
  const tableau = new THREE.Group();
  [...scene.children].forEach(object => tableau.add(object));
  tableau.position.x = -4.6;
  scene.add(tableau);

  // Full-resolution canvas typography: scarlet enamel, pale bevel and deep extrusion.
  const canvas = document.createElement('canvas'); canvas.width = 1920; canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  const shade = ctx.createLinearGradient(850, 0, 1920, 0);
  shade.addColorStop(0, 'rgba(0,2,5,0)');
  shade.addColorStop(0.28, 'rgba(0,2,5,0.72)');
  shade.addColorStop(1, 'rgba(0,0,0,0.94)');
  ctx.fillStyle = shade; ctx.fillRect(0, 0, 1920, 1080);
  function titleLine(text, centerX, baseline, size, maxWidth) {
    ctx.save();
    ctx.font = `900 ${size}px "Arial Black", "Arial", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    const width = ctx.measureText(text).width;
    ctx.translate(centerX, baseline); ctx.scale(Math.min(1, maxWidth / width), 1);
    ctx.strokeStyle = '#090002'; ctx.lineWidth = 16; ctx.strokeText(text, 0, 0);
    ctx.fillStyle = '#420009';
    for (let depth = 11; depth > 0; depth--) ctx.fillText(text, depth * 0.3, depth);
    ctx.shadowColor = '#fa061e'; ctx.shadowBlur = 28;
    ctx.strokeStyle = '#ff6870'; ctx.lineWidth = 3; ctx.strokeText(text, 0, 0);
    ctx.shadowBlur = 0;
    const ink = ctx.createLinearGradient(0, -size * 0.8, 0, size * 0.06);
    ink.addColorStop(0, '#fff0da'); ink.addColorStop(0.075, '#ff6b6d');
    ink.addColorStop(0.24, '#ff172d'); ink.addColorStop(0.50, '#e90820');
    ink.addColorStop(0.51, '#a00014'); ink.addColorStop(1, '#3d0009');
    ctx.fillStyle = ink; ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  titleLine('DEA*H', 1430, 420, 225, 830);
  titleLine('TO THE', 1430, 585, 108, 650);
  titleLine('RABBITS', 1430, 790, 176, 840);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const overlay = mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
    map: texture, transparent: true, depthTest: false, depthWrite: false
  }), camera);
  overlay.position.z = -1; overlay.renderOrder = 100; scene.add(camera);
  function update() {
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    overlay.scale.set(height * camera.aspect, height, 1);
  }
  update();
  return { config: SCENE_CONFIG, update };
}
