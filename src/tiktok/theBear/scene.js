import * as THREE from 'three';
import { createBearHoneyTrapScene } from '../../scenes/bearHoneyTrap.js';
import { createPitRabbitsScene } from '../../scenes/pitRabbits.js';
import { createHoneyBetrayalScene } from '../../scenes/honeyBetrayal.js';
import { createDeathToRabbitsScene } from '../../scenes/deathToRabbits.js';
import { createHorrorForest } from '../../environment/horrorForest.js';
import { getShotAt } from '../../runtime/shotTimeline.js';
import { SHOTS } from './shots.js';
import { bakeLegacy } from './legacyBake.js';
import { createTheBearActing } from './acting.js';
export const SCENE_CONFIG = { id: 'tiktok-the-bear-main', title: 'The Bear — V5 · Trust has a limit', duration: SHOTS.at(-1).end, shots: SHOTS, seekable: true };
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
      const lamp = new THREE.PointLight(0xe7d2b1, 4.5, 4, 2);
      lamp.position.set(0, -2.35, 1.25); handFill.add(lamp); root.add(handFill);
      root.add(new THREE.AmbientLight(0x9badbe, 0.5));
      // The remaining sky catches the rabbits at the rim. This light stays
      // fixed through the strike, reaction and escape, while the pit stays dark.
      const rimSky = new THREE.PointLight(0xaac9df, 5.5, 8, 2);
      rimSky.position.set(0, 4.25, -2.8); root.add(rimSky);
    }
    if (name === 'pit') {
      const fill = new THREE.PointLight(0xffead0, 5.2, 7, 2);
      fill.position.set(-1.5, -2.3, -0.8); root.add(fill);
      root.add(new THREE.AmbientLight(0xd6c3ad, 1.2));
      // Reconstruct the same pit dimensions, floor and wall palette used by
      // the bargain. Legacy source animation stays isolated and unchanged.
      const pitGroup = root.children.find(o => o.children.some(child => child.geometry?.type === 'CylinderGeometry' && child.geometry.parameters.radiusTop > 2));
      const wall = pitGroup.children.find(o => o.geometry?.type === 'CylinderGeometry');
      const floor = pitGroup.children.find(o => o.geometry?.type === 'CircleGeometry');
      wall.position.y = -0.88; wall.scale.y = 5 / 3.2;
      wall.material = wall.material.clone(); wall.material.color.setHex(0x563f30);
      floor.position.y = -3.38;
      floor.material = floor.material.clone(); floor.material.color.setHex(0x69503a);
      const rim = root.children.find(o => o.geometry?.type === 'RingGeometry');
      rim.material = rim.material.clone(); rim.material.color.setHex(0x658047);
    }
    if (name === 'trap' || name === 'pit') {
      // One late-afternoon direction carries across the fall into the pit.
      const sun = root.children.find(o => o.isDirectionalLight);
      sun.color.setHex(0xffe4bd);
      sun.position.set(-3, 8, 4);
    }
    if (name === 'deal' || name === 'revenge') {
      const floorExtension = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: name === 'deal' ? 0x69503a : 0x303038, roughness: 1 }));
      floorExtension.rotation.x = -Math.PI / 2; floorExtension.position.y = -3.39; root.add(floorExtension);
    }
    const forest = ['trap', 'pit', 'deal'].includes(name) ? createHorrorForest() : null;
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
  // The legacy bake ends on the fallen branch. Restore its first snapshot
  // before capturing the stable branch pose used by V4's vibration pass.
  worlds.trap.update(0);
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
    scene.background = world.root.background; scene.fog = world.root.fog;
    scene.updateMatrixWorld(true);
    const a = world.actors, b = a.b;
    let bounds, view = [0.1, 0.05, 1], push = 0.025;
    camera.up.set(0, 1, 0);
    switch (shot.framing) {
      case 'honey-hook': bounds = around(a.honey, 0.85, 0.9, 0.65); view = [0.65, 0.2, 1]; push = 0; break;
      case 'scent': bounds = around(b.headGroup, 1.15, 1.2, 0.8, [0, -0.03, 0]); view = [0.12, 0.1, 1]; push = 0; break;
      case 'approach': bounds = around(b.bear, 3.1, 3.1, 1.5, [0.65, 1, 0]); view = [0.45, 0.12, 1]; push = 0; break;
      case 'decision': bounds = [[-1.7, -0.1, -0.9], [1.15, 3.9, 0.9]]; view = [0.4, 0.16, 1]; push = 0; break;
      case 'climb-tree': bounds = [[-1.15, 0, -0.8], [1.0, 4.0, 0.9]]; view = [0.4, 0.17, 1]; push = 0; break;
      case 'branch-cross': case 'branch-warning': bounds = [[-0.55, 2.15, -0.8], [3.85, 4.18, 0.8]]; view = [1, 0.22, 0.6]; push = 0; break;
      case 'pit-bear': bounds = [[-2.9, -1.65, -0.9], [-0.2, 0.75, 1.1]]; view = [-0.7, 0.2, -1]; break;
      case 'pit-brace': case 'pit-look': bounds = around(b.bear, 2.6, 2.7, 1.5, [0, 0.7, 0]); view = [0.3, 0.2, -1]; push = 0; break;
      case 'pit-rabbits': case 'pit-laugh': bounds = [[-2.65, 0.6, -3.75], [2.65, 3.85, -2.1]]; view = [0, -0.25, 1]; push = 0; break;
      case 'trap': bounds = [[0.2, -0.6, -0.7], [3.65, 4.1, 0.9]]; view = [0.3, 0.15, 1]; push = 0; break;
      case 'rabbits': bounds = [[-1.35, 2.15, -3.7], [1.35, 3.72, -2.5]]; view = [0, -0.06, 1]; break;
      case 'rabbit-leader': bounds = around(a.rabbits[0].headGroup, 1.15, 1.55, 0.7); view = [0.2, 0, 1]; push = 0; break;
      case 'bear': bounds = around(b.headGroup, 1.55, 2.1, 0.85, [0, -0.25, 0]); view = [0.25, 0.12, 1]; break;
      case 'recovery': bounds = around(b.bear, 2.1, 3.1, 1, [0, 1.0, 0]); view = [0.2, 0.2, -1]; break;
      case 'honey': bounds = around(a.honey, 0.8, 0.9); view = [0.3, 0.9, 1]; break;
      case 'pickup': bounds = around(b.headGroup, 1.7, 2.1, 0.85, [0.2, -0.25, 0]); view = [0.55, 0.35, 1]; break;
      case 'ladder': bounds = [[-0.9, -3.2, -2.9], [0.9, 3.4, -2.05]]; view = [0.45, 0.03, 1]; break;
      case 'climb': bounds = around(b.bear, 1.75, 3.6, 1, [0, 1.1, 0]); view = [0.9, 0.1, 0.65]; break;
      case 'climb-hope': bounds = around(b.headGroup, 1.4, 2.0, 0.85, [0, -0.18, 0]); view = [0.5, 0.12, 1]; push = 0; break;
      case 'exchange': bounds = [[-1.15, 0.85, -3.55], [0.7, 3.55, -1.6]]; view = [-0.85, 0.1, 0.65]; break;
      case 'choice-face': bounds = around(b.headGroup, 1.18, 1.35, 0.75, [-0.12, 0, 0]); view = [-1, 0.05, 0.45]; push = 0; break;
      case 'choice-hands': bounds = [[-0.9, 1.05, -3.1], [0.55, 3.15, -1.65]]; view = [-0.75, 0.2, 0.6]; push = 0; break;
      case 'release': bounds = [[-1.3, 1.65, -3.65], [1.25, 3.65, -2.05]]; view = [0.1, 0.05, 1]; break;
      case 'fall': bounds = around(b.bear, 2, 3.25, 1.7, [0, 0.6, 0]); view = [0.55, 0.3, 1]; push = 0; break;
      case 'anger-push': bounds = around(b.headGroup, THREE.MathUtils.lerp(1.85, 0.76, progress), THREE.MathUtils.lerp(2.1, 0.9, progress), 0.65); view = [0, 0.07, -1]; push = 0; break;
      case 'revenge-anger': bounds = around(b.headGroup, 1.03, 1.3, 0.65); view = [0, 0.07, -1]; push = 0; break;
      case 'discovery': bounds = [[-1.0, -3.0, -0.3], [1.0, -1.25, 0.9]]; view = [0.25, 0.15, 1]; push = 0; break;
      case 'fingers-push': bounds = [[-0.95, -3.15, -0.35], [0.95, -1.2, 0.9]]; view = [0, 0.2, 1]; push = 0; break;
      case 'weapon': bounds = [[-1.25, -3.45, -1], [1.95, -1.1, 1.1]]; view = [0.6, 0.3, 1]; break;
      case 'fire': bounds = around(b.headGroup, 1.18, 1.5, 0.7); view = [0, 0.1, -1]; break;
      case 'grin-push': bounds = around(b.headGroup, THREE.MathUtils.lerp(1.75, 0.68, progress), THREE.MathUtils.lerp(2.05, 0.82, progress), 0.65); view = [0, 0.1, -1]; push = 0; break;
      case 'throw': bounds = [[-0.9, -3.35, -1.05], [0.9, -0.9, 0.9]]; view = [1, 0.05, 0.2]; break;
      case 'impact': bounds = [[-1.25, 2.05, -3.75], [0.2, 3.8, -2.55]]; view = [-0.7, 0.15, 1]; break;
      case 'corpse': bounds = around(a.rabbits[0].rabbit, 1.7, 2.5, 1.0, [0, 0.25, 0]); view = [-0.5, 0.25, 1]; push = 0;
        break;
      case 'survivors-group': bounds = [[-2.55, 1.45, -4.05], [2.55, 4.18, -2.25]]; view = [0, -0.25, 1]; push = 0; break;
      case 'survivor-close': bounds = around(a.rabbits[1].headGroup, 1.2, 1.65, 0.8); view = [0, 0.05, 1]; push = 0; break;
      case 'point': bounds = [[-1.2, -3.4, -1.85], [1.0, -1.05, 0.7]]; view = [0, 0.6, -1]; push = 0; break;
      case 'run-group': bounds = [[-3.5, 1.45, -7], [3.5, 4.15, -1.5]]; view = [0, 0.4, 1]; push = 0; break;
      case 'wounded': bounds = around(b.headGroup, 1.45, 1.65, 0.8, [0, -0.1, 0]); view = [0, 0.06, -1]; push = 0; break;
    }
    compose(bounds, view, progress, push);
    if (shot.framing === 'approach') {
      const centerX = THREE.MathUtils.lerp(-1.5, -0.52, progress);
      camera.position.set(centerX, 2.05, 7.0);
      camera.lookAt(centerX, 1.55, 0);
      camera.fov = 62; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'decision') {
      camera.position.set(-0.85, 1.7, 5.4);
      camera.lookAt(THREE.MathUtils.lerp(-0.85, -0.15, progress), THREE.MathUtils.lerp(1.6, 2.75, progress), 0);
      camera.fov = 58; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'climb-tree') {
      const rise = THREE.MathUtils.clamp((sourceTime - 7.5) / 3.5, 0, 1);
      // Follow more slowly than Balu rises so progress up the trunk remains
      // visible instead of pinning his body to the same place in the frame.
      camera.position.set(1.35, 2.15 + 1.15 * rise, 3.85);
      camera.lookAt(0, 1.85 + 1.35 * rise, 0.45);
      camera.fov = 52; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'branch-cross') {
      camera.position.set(2.8, 3.7, 7.1);
      camera.lookAt(1.75, 3.0, 0);
      camera.fov = 52; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'branch-warning') {
      camera.position.set(3.45, 3.75, 4.85 - 0.3 * progress);
      camera.lookAt(2.35, 3.22, 0);
      camera.fov = 55; camera.updateProjectionMatrix();
    }
    // An exterior camera below ground would otherwise see the near rim as a
    // ceiling. Remove that foreground obstruction for these editorial angles.
    if (shot.framing === 'pit-bear') {
      const focus = b.headGroup.getWorldPosition(V());
      camera.position.set(0.1, -1.15, -1.55);
      camera.lookAt(focus.clone().add(V(0, -0.25, 0)));
      camera.fov = 68; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'pit-brace') {
      const head = b.headGroup.getWorldPosition(V());
      camera.position.set(-0.85 - 0.35 * progress, -1.5, -2.55 + 0.3 * progress);
      camera.lookAt(head.clone().add(V(0, -0.35, 0)));
      camera.fov = 68; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'pit-look') {
      const head = b.headGroup.getWorldPosition(V());
      camera.position.copy(head).add(V(1.4, 0.25, -1.95));
      camera.lookAt(head.clone().add(V(0, 0.04, 0)));
      camera.fov = 51; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'pit-rabbits' || shot.framing === 'pit-laugh') {
      camera.position.set(0, -1.1, 1.6); camera.lookAt(0, 1.5, -3.1);
      camera.fov = 94; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'choice-face') {
      const face = b.headGroup.getWorldPosition(V());
      camera.position.set(-1.8, 1.75, -2.45);
      camera.lookAt(face);
      camera.fov = 67; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'rabbit-leader') {
      const leader = a.rabbits[0].headGroup.getWorldPosition(V());
      camera.position.copy(leader).add(V(0.35, 0.08, 2.8));
      camera.lookAt(leader.clone().add(V(0, -0.13, 0)));
      camera.fov = 49; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'pickup') {
      camera.position.set(0.75, -1.2, 3.8);
      camera.lookAt(-0.4, -2.48, 0.47);
      camera.fov = 58; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'climb-hope') {
      const head = b.headGroup.getWorldPosition(V());
      camera.position.set(1.4, 1.1, 0.35);
      camera.lookAt(head.clone().add(V(0, 0.25, 0)));
      camera.fov = 60; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'fingers-push') {
      camera.position.set(0, -2.1, THREE.MathUtils.lerp(3.5, 2.25, progress));
      camera.lookAt(0, -2.55, 0);
      camera.fov = 43; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'discovery') {
      camera.position.set(0.6, -1.7, 2.55);
      camera.lookAt(0, -2.25, 0);
      camera.fov = 48; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'weapon') {
      camera.position.set(1.5, -1.55, 2.15);
      camera.lookAt(0.4, -2.72, -0.15);
      camera.fov = 53; camera.updateProjectionMatrix();
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
    if (shot.framing === 'survivor-close') {
      const witness = a.rabbits[1].headGroup.getWorldPosition(V());
      camera.position.copy(witness).add(V(0.45, 0.12, 3.1 - 0.28 * progress));
      camera.lookAt(witness.clone().add(V(0, -0.10, 0)));
      camera.fov = 49; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'run-group') {
      const survivors = a.rabbits.slice(1).map(r => r.rabbit.getWorldPosition(V()));
      const minX = Math.min(...survivors.map(p => p.x));
      const maxX = Math.max(...survivors.map(p => p.x));
      const centerX = (minX + maxX) / 2;
      const centerZ = survivors.reduce((sum, p) => sum + p.z, 0) / survivors.length;
      // Stay close enough to read all three sprints as their lanes separate.
      const distance = Math.max(6, (maxX - minX) / 0.7);
      camera.position.set(centerX + 0.25, 3.55 + (shot.id === 'revenge-scatter' ? progress * 0.8 : 0), centerZ + distance);
      camera.lookAt(centerX, 2.75, centerZ);
      camera.fov = 58; camera.updateProjectionMatrix();
    }
    if (shot.framing === 'corpse') {
      const victim = a.rabbits[0].rabbit.getWorldPosition(V());
      camera.position.copy(victim).add(V(-1.8, 1.35, 3.2));
      camera.lookAt(victim.clone().add(V(0, 0.45, 0.15)));
      camera.fov = 54; camera.updateProjectionMatrix();
    }
    if (world.rim) {
      world.rim.visible = true;
      acting.rimVisibility(world);
    }
  }
  update(0);
  return { config: SCENE_CONFIG, update, worlds };
}
