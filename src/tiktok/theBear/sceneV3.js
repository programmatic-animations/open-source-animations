import * as THREE from 'three';
import { createBearHoneyTrapScene } from '../../scenes/bearHoneyTrap.js';
import { createPitRabbitsScene } from '../../scenes/pitRabbits.js';
import { createHoneyBetrayalScene } from '../../scenes/honeyBetrayal.js';
import { createDeathToRabbitsScene } from '../../scenes/deathToRabbits.js';
import { createHorrorForest } from '../../environment/horrorForest.js';
import { getShotAt } from '../../runtime/shotTimeline.js';
import { SHOTS } from './shotsV3.js';
import { bakeLegacy } from './legacyBake.js';
import { createTheBearActing } from './actingV3.js';
export const SCENE_CONFIG = { id: 'tiktok-the-bear-v3', title: 'The Bear — V3 · Trust has a limit', duration: SHOTS.at(-1).end, shots: SHOTS, seekable: true };
const V = (...v) => new THREE.Vector3(...v);

export function createTheBearScene({ scene, camera }) {
  const worlds = {};
  for (const [name, create] of Object.entries({ trap: createBearHoneyTrapScene, pit: createPitRabbitsScene, deal: createHoneyBetrayalScene, revenge: createDeathToRabbitsScene })) {
    const root = new THREE.Scene(); root.name = `the-bear-${name}`;
    const take = create({ scene: root, camera });
    if (name === 'trap' || name === 'pit') take.update = bakeLegacy(root, take.update, name === 'trap' ? 18.2 : 9.5);
    // This cut uses geometric scenery only, including the daylight world.
    const backdrops = root.children.filter(o => o.isMesh && o.material?.map);
    if (name === 'revenge') {
      const handFill = new THREE.Group();
      const lamp = new THREE.PointLight(0xe7d2b1, 5, 4, 2);
      lamp.position.set(0, -2.35, -1.2); handFill.add(lamp); root.add(handFill);
    }
    if (name === 'pit') {
      const fill = new THREE.PointLight(0xffead0, 7, 7, 2);
      fill.position.set(-1.5, -0.5, -0.8); root.add(fill);
      root.add(new THREE.AmbientLight(0xd6c3ad, 1.2));
      const floorExtension = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0x070606, roughness: 1, side: THREE.DoubleSide }));
      floorExtension.rotation.x = -Math.PI / 2; floorExtension.position.y = -1.6; root.add(floorExtension);
    }
    if (name === 'deal' || name === 'revenge') {
      const floorExtension = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: name === 'deal' ? 0x69503a : 0x303038, roughness: 1 }));
      floorExtension.rotation.x = -Math.PI / 2; floorExtension.position.y = -3.39; root.add(floorExtension);
    }
    const forest = name === 'trap' || name === 'deal' ? createHorrorForest() : null;
    if (forest) {
      forest.position.y = name === 'trap' ? -1.63 : 0;
      const leaves = new THREE.MeshStandardMaterial({ color: 0x52743e, roughness: 1 });
      for (let i = 0; i < 18; i++) {
        const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(1.65, 1), leaves);
        canopy.position.set((i % 9 - 4) * 2.2, 6.5 + Math.sin(i * 2) * 1.1, -7.5 - Math.floor(i / 9) * 3);
        canopy.scale.set(1.25, 0.8, 1); forest.add(canopy);
      }
      root.add(forest);
    }
    worlds[name] = { root, ...take, backdrops, rim: root.children.find(o => o.isMesh && o.geometry.type === 'RingGeometry') };
    scene.add(root);
  }
  const acting = createTheBearActing(worlds);
  const box = new THREE.Box3();
  const center = V(), direction = V(), corner = V();
  // Fit a fixed shot box to native portrait projection, with safe margins.
  // Boxes, rather than animated mesh bounds, prevent distracting zoom pumping.
  function compose(bounds, view, progress, push = 0.025) {
    box.set(V(...bounds[0]), V(...bounds[1])); box.getCenter(center);
    direction.set(...view).normalize(); camera.position.copy(center).add(direction); camera.lookAt(center);
    camera.fov = 43; camera.zoom = 1; camera.aspect = 9 / 16;
    const inverse = camera.quaternion.clone().invert();
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    let distance = 0;
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      corner.set(x, y, z).sub(center).applyQuaternion(inverse);
      distance = Math.max(distance, corner.z + Math.abs(corner.x) / (tangent * camera.aspect * 0.84), corner.z + Math.abs(corner.y) / (tangent * 0.84));
    }
    camera.position.copy(center).addScaledVector(direction, distance * (1 - push * progress));
    camera.lookAt(center); camera.updateProjectionMatrix();
  }
  function around(object, width, height, depth = 0.6, offset = [0, 0, 0]) {
    const p = object.getWorldPosition(V()).add(V(...offset));
    return [p.clone().add(V(-width / 2, -height / 2, -depth / 2)).toArray(), p.clone().add(V(width / 2, height / 2, depth / 2)).toArray()];
  }
  function update(time) {
    const { shot, progress } = getShotAt(SHOTS, time);
    const world = worlds[shot.world];
    Object.values(worlds).forEach(w => { w.root.visible = w === world; });
    const sourceTime = THREE.MathUtils.lerp(shot.from, shot.to, progress);
    world.update(sourceTime);
    if (shot.world === 'trap') acting.trapPose(sourceTime);
    if (shot.world === 'pit') acting.pitPose(sourceTime);
    if (shot.world === 'deal') acting.dealPose(sourceTime);
    if (shot.world === 'revenge') acting.revengePose(sourceTime, shot.framing);
    world.backdrops.forEach(o => { o.visible = false; });
    if (shot.world === 'revenge') {
      world.root.children.filter(o => o.isLight).forEach(light => { light.intensity *= light.isHemisphereLight ? 1.45 : 1.25; });
    }
    scene.background = world.root.background; scene.fog = world.root.fog;
    scene.updateMatrixWorld(true);
    const a = world.actors, b = a.b;
    let bounds, view = [0.1, 0.05, 1], push = 0.025;
    camera.up.set(0, 1, 0);
    switch (shot.framing) {
      case 'face-hook': bounds = around(b.headGroup, 1.0, 1.15, 0.8); view = [1, 0.1, 0.1]; push = 0; break;
      case 'branch-approach': bounds = [[-0.55, 2.15, -0.8], [3.85, 4.18, 0.8]]; view = [1, 0.22, 0.6]; push = 0; break;
      case 'pit-bear': bounds = [[-2.9, -1.65, -0.9], [-0.2, 0.75, 1.1]]; view = [-0.7, 0.2, -1]; break;
      case 'pit-rabbits': case 'pit-laugh': bounds = [[-2.65, 0.6, -3.75], [2.65, 3.85, -2.1]]; view = [0, -0.25, 1]; push = 0; break;
      case 'trap': bounds = [[0.2, -0.6, -0.7], [3.65, 4.1, 0.9]]; view = [0.3, 0.15, 1]; push = 0; break;
      case 'rabbits': bounds = [[-1.35, 2.15, -3.7], [1.35, 3.72, -2.5]]; view = [0, -0.06, 1]; break;
      case 'bear': bounds = around(b.headGroup, 1.55, 2.1, 0.85, [0, -0.25, 0]); view = [0.25, 0.12, 1]; break;
      case 'recovery': bounds = around(b.bear, 2.1, 3.1, 1, [0, 1.0, 0]); view = [0.2, 0.2, -1]; break;
      case 'honey': bounds = around(a.honey, 0.8, 0.9); view = [0.3, 0.9, 1]; break;
      case 'pickup': bounds = around(b.headGroup, 1.7, 2.1, 0.85, [0.2, -0.25, 0]); view = [0.55, 0.35, 1]; break;
      case 'ladder': bounds = [[-0.9, -3.2, -2.9], [0.9, 3.4, -2.05]]; view = [0.45, 0.03, 1]; break;
      case 'climb': bounds = around(b.bear, 1.75, 3.6, 1, [0, 1.1, 0]); view = [0.9, 0.1, 0.65]; break;
      case 'exchange': bounds = [[-1.15, 0.85, -3.55], [0.7, 3.55, -1.6]]; view = [-0.85, 0.1, 0.65]; break;
      case 'choice': bounds = around(b.headGroup, 1.55, 1.65, 1, [-0.2, 0, 0]); view = [-1, 0.05, 0.45]; break;
      case 'release': bounds = [[-1.3, 1.65, -3.65], [1.25, 3.65, -2.05]]; view = [0.1, 0.05, 1]; break;
      case 'fall': bounds = around(b.bear, 2, 3.25, 1.7, [0, 0.6, 0]); view = [0.55, 0.3, 1]; push = 0; break;
      case 'anger-push': bounds = around(b.headGroup, THREE.MathUtils.lerp(1.85, 0.76, progress), THREE.MathUtils.lerp(2.1, 0.9, progress), 0.65); view = [0, 0.07, -1]; push = 0; break;
      case 'revenge-anger': bounds = around(b.headGroup, 1.03, 1.3, 0.65); view = [0, 0.07, -1]; push = 0; break;
      case 'fingers-push': bounds = [[-0.95, -3.15, -0.35], [0.95, -1.2, 0.9]]; view = [0, 0.2, 1]; push = 0; break;
      case 'weapon': bounds = [[-1.25, -3.45, -1], [1.95, -1.1, 1.1]]; view = [0.6, 0.3, 1]; break;
      case 'fire': bounds = around(b.headGroup, 1.18, 1.5, 0.7); view = [0, 0.1, -1]; break;
      case 'grin-push': bounds = around(b.headGroup, THREE.MathUtils.lerp(1.75, 0.68, progress), THREE.MathUtils.lerp(2.05, 0.82, progress), 0.65); view = [0, 0.1, -1]; push = 0; break;
      case 'throw': bounds = [[-0.9, -3.35, -1.05], [0.9, -0.9, 0.9]]; view = [1, 0.05, 0.2]; break;
      case 'impact': bounds = [[-1.25, 2.05, -3.75], [0.2, 3.8, -2.55]]; view = [-0.7, 0.15, 1]; break;
      case 'corpse': bounds = around(a.rabbits[0].rabbit, 2.5, 3.25, 1.5, [0, 0.8, 0]); view = [0.5, 0.35, 1]; push = 0;
        break;
      case 'survivors-group': bounds = [[-2.55, 1.45, -4.05], [2.55, 4.18, -2.25]]; view = [0, -0.25, 1]; push = 0; break;
      case 'point': bounds = [[-1.2, -3.4, -1.85], [1.0, -1.05, 0.7]]; view = [0, 0.6, -1]; push = 0; break;
      case 'run-group': bounds = [[-3.5, 1.45, -7], [3.5, 4.15, -1.5]]; view = [0, 0.4, 1]; push = 0; break;
    }
    compose(bounds, view, progress, push);
    if (shot.framing === 'face-hook') {
      const head = b.headGroup.getWorldPosition(V());
      const q = b.headGroup.getWorldQuaternion(new THREE.Quaternion());
      const face = V(0, 0, 1).applyQuaternion(q);
      camera.position.copy(head).addScaledVector(face, 1.9);
      camera.up.copy(V(0, -1, 0).applyQuaternion(q));
      camera.lookAt(head);
      camera.fov = 48; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'branch-approach') {
      camera.position.set(3.1, 3.45, 8.8);
      camera.lookAt(2.0, 3.05, 0);
      camera.fov = 49; camera.updateProjectionMatrix();
    }
    // An exterior camera below ground would otherwise see the near rim as a
    // ceiling. Remove that foreground obstruction for these editorial angles.
    if (shot.framing === 'pit-bear') {
      const focus = b.headGroup.getWorldPosition(V());
      camera.position.copy(focus).add(V(0.65, 0.75, -2.75)); camera.lookAt(focus.clone().add(V(0, -0.37, 0)));
      camera.fov = 72; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'pit-rabbits' || shot.framing === 'pit-laugh') {
      camera.position.set(0, -1.1, 1.6); camera.lookAt(0, 1.5, -3.1);
      camera.fov = 94; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'choice') {
      camera.position.set(-1.9, 1.85, -1.8); camera.lookAt(-0.12, 1.35, -2.28);
      camera.fov = 70; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'fingers-push') {
      camera.position.set(0, -1.5, THREE.MathUtils.lerp(4.7, 2.55, progress));
      camera.lookAt(0, -2.33, 0);
      camera.fov = 48; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'point') {
      camera.position.set(0.25, 0.65, -2.6);
      camera.lookAt(-0.25, -2.5, -0.4);
      camera.fov = 62; camera.updateProjectionMatrix();
      const arm = b.leftArm;
      const shoulder = arm.getWorldPosition(V());
      const towardCamera = b.bear.worldToLocal(camera.position.clone()).sub(arm.position).normalize();
      const aim = new THREE.Quaternion().setFromUnitVectors(V(0, -1, 0), towardCamera);
      arm.quaternion.slerp(aim, THREE.MathUtils.smoothstep(sourceTime, 30.5, 31.5));
      arm.updateMatrixWorld(true);
    }
    if (shot.framing === 'survivors-group') {
      camera.position.set(0, -1.0, 2.15 - progress * 0.52);
      camera.lookAt(0, 2.9, -3.18);
      camera.fov = 82; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'run-group') {
      const survivors = a.rabbits.slice(1).map(r => r.rabbit.getWorldPosition(V()));
      const centerZ = survivors.reduce((sum, p) => sum + p.z, 0) / survivors.length;
      const followBack = 10.5 + 4.5 * THREE.MathUtils.smoothstep(progress, 0.2, 0.7);
      camera.position.set(0, 5.2 + progress * 0.8, centerZ + followBack);
      camera.lookAt(0, 2.6, centerZ);
      camera.fov = 59; camera.updateProjectionMatrix();
    }
    if (world.rim) {
      world.rim.visible = !(center.y < 1.63 && Math.hypot(camera.position.x, camera.position.z) > 3.2);
      acting.rimVisibility(world);
    }
  }
  update(0);
  return { config: SCENE_CONFIG, update, worlds };
}
