import * as THREE from 'three';

// Opt-in facial anatomy. All surfaces are built once; bounded morph weights
// deform the muzzle without scaling bones or moving the head attachment.
export const NATIVE_MOUTH_CONTRACT = Object.freeze({
  balu: { anchor: [0, -.13, .42], radii: [.27, .2025, .1755], halfWidth: .135, center: -.073, opening: .085, depth: .038, lip: .0035,
    teeth: { profile: 'tapered', size: [.023, .020, .016], centers: [-.065, -.039, -.013, .013, .039, .065] } },
  rabbit: { anchor: [0, -.12, .36], radii: [.209, .133, .1235], halfWidth: .101, center: -.047, opening: .060, depth: .027, lip: .0025,
    teeth: { profile: 'incisors', size: [.037, .026, .015], centers: [-.037 * .52, .037 * .52] } }
});
export const VISEMES = Object.freeze({
  X: { width: .90, open: 0 }, A: { width: .85, open: 0 },
  B: { width: 1, open: .17 }, C: { width: 1.02, open: .53 },
  D: { width: .95, open: 1 }, E: { width: .69, open: .59 },
  F: { width: .48, open: .38, pucker: 1 },
  G: { width: .90, open: .16, contact: 1 }, H: { width: .98, open: .49, tongue: 1 }
});
const clamp = value => THREE.MathUtils.clamp(value, 0, 1);
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

export function visemeAt(cues, time) {
  const index = cues.findIndex(cue => time >= cue.start && time < cue.end);
  if (index < 0) return { shape: 'X', weights: { X: 1 }, open: 0, tongue: 0, contact: 0 };
  const cue = cues[index], shape = VISEMES[cue.value] ? cue.value : 'X';
  const previous = index && cues[index - 1].end >= cue.start - .001 ? cues[index - 1].value : 'X';
  const from = VISEMES[previous] ? previous : 'X';
  // Fast closures preserve short plosives; other shapes ease for at most 55ms.
  const blend = smooth((time - cue.start) / Math.min(shape === 'A' || shape === 'X' ? .025 : .055, (cue.end - cue.start) / 2));
  const weights = from === shape ? { [shape]: 1 } : { [from]: 1 - blend, [shape]: blend };
  const channel = name => Object.entries(weights).reduce((sum, [key, weight]) => sum + (VISEMES[key][name] || 0) * weight, 0);
  return { shape, weights, open: channel('open'), tongue: channel('tongue'), contact: channel('contact') };
}

const segments = 64;
function surfaceZ(c, x, y) {
  return c.radii[2] * Math.sqrt(Math.max(0, 1 - (x / c.radii[0]) ** 2 - (y / c.radii[1]) ** 2));
}
function rim(c, pose, theta, expression = 0) {
  const width = c.halfWidth * pose.width;
  const open = .0015 + c.opening * pose.open;
  const x = width * Math.cos(theta);
  const y = c.center - open * .28 + open * .5 * Math.sin(theta) + .014 * expression * Math.cos(theta) ** 2;
  return [x, y, surfaceZ(c, x, y) + .002 + .008 * (pose.pucker || 0)];
}
function arrays(c, pose, kind, expression = 0) {
  const values = [], rows = kind === 'skin' ? 12 : kind === 'cavity' ? 7 : 8;
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= segments; i++) {
    const theta = i / segments * Math.PI * 2, r = j / rows;
    const [x, y, z] = rim(c, pose, theta, expression);
    if (kind === 'skin') {
      const px = THREE.MathUtils.lerp(x, c.radii[0] * Math.cos(theta), r);
      const py = THREE.MathUtils.lerp(y, c.radii[1] * Math.sin(theta), r);
      values.push(px, py, surfaceZ(c, px, py) + .002 * (1 - r));
    } else if (kind === 'cavity') {
      values.push(x * (1 - r), THREE.MathUtils.lerp(y, c.center - .025 * pose.open, r), z - c.depth * Math.sin(r * Math.PI / 2));
    } else {
      const a = r * Math.PI * 2;
      values.push(x + c.lip * Math.cos(theta) * Math.cos(a), y + c.lip * Math.sin(theta) * Math.cos(a), z + c.lip * Math.sin(a));
    }
  }
  return { values, rows };
}
function geometry(c, kind) {
  const base = arrays(c, VISEMES.X, kind), index = [];
  for (let row = 0; row < base.rows; row++) for (let i = 0; i < segments; i++) {
    const a = row * (segments + 1) + i, b = a + segments + 1;
    index.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(base.values, 3));
  g.setIndex(index); g.computeVertexNormals();
  g.morphTargetsRelative = true;
  g.morphAttributes.position = [];
  g.morphAttributes.normal = [];
  const targets = [...Object.entries(VISEMES), ['smile', VISEMES.X], ['frown', VISEMES.X]];
  for (const [name, pose] of targets) {
    const target = arrays(c, pose, kind, name === 'smile' ? 1 : name === 'frown' ? -1 : 0).values;
    const temp = new THREE.BufferGeometry(); temp.setAttribute('position', new THREE.Float32BufferAttribute(target, 3)); temp.setIndex(index); temp.computeVertexNormals();
    const normals = temp.attributes.normal.array, baseNormals = g.attributes.normal.array;
    const positions = new THREE.Float32BufferAttribute(target.map((value, i) => value - base.values[i]), 3); positions.name = name;
    g.morphAttributes.position.push(positions);
    g.morphAttributes.normal.push(new THREE.Float32BufferAttribute(Array.from(normals, (value, i) => value - baseNormals[i]), 3));
    temp.dispose();
  }
  // Include every target in bounds; opening must never be frustum-culled.
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.max(...c.radii) + .06);
  return g;
}

function toothGeometry(anatomy) {
  const [width, height, depth] = anatomy.size;
  if (anatomy.profile === 'incisors') return new THREE.BoxGeometry(width, height, depth);
  // Small tapered crowns with softened tips; fixed geometry, not large fangs.
  const crown = new THREE.Shape();
  crown.moveTo(-width / 2, height / 2);
  crown.lineTo(-width * .10, -height / 2);
  crown.lineTo(width * .10, -height / 2);
  crown.lineTo(width / 2, height / 2);
  crown.closePath();
  const g = new THREE.ExtrudeGeometry(crown, { depth: depth - .0016, steps: 1,
    bevelEnabled: true, bevelThickness: .0008, bevelSize: .0008, bevelSegments: 2 });
  g.translate(0, 0, -(depth - .0016) / 2);
  return g;
}

export function createNativeMouth(rig) {
  const contract = NATIVE_MOUTH_CONTRACT[rig.character];
  if (!contract) throw new Error('Native mouth requires Balu or rabbit');
  const head = rig.visual.headGroup;
  const original = head.children.find(node => node.isMesh && Math.abs(node.position.y - contract.anchor[1]) < .0001 && Math.abs(node.position.z - contract.anchor[2]) < .0001);
  if (!original) throw new Error('Expected character muzzle attachment');
  const originalVisible = original.visible, jawVisible = rig.visual.jaw?.visible;
  original.visible = false;
  if (rig.visual.jaw) rig.visual.jaw.visible = false;
  const group = new THREE.Group(); group.name = 'native-mouth'; group.position.fromArray(contract.anchor); head.add(group);
  const dark = new THREE.MeshStandardMaterial({ color: '#28181b', roughness: 1, side: THREE.DoubleSide });
  const edge = new THREE.MeshStandardMaterial({ color: original.material.color.clone().multiplyScalar(.84), roughness: 1, side: THREE.DoubleSide });
  // Real front muzzle skin surrounds an opening. The dark cavity is recessed,
  // rather than placed in front of an intact solid muzzle.
  const skinMaterial = original.material.clone(); skinMaterial.side = THREE.DoubleSide;
  const surfaces = ['skin', 'cavity', 'lip'].map((kind, i) => {
    const mesh = new THREE.Mesh(geometry(contract, kind), [skinMaterial, dark, edge][i]); mesh.name = kind; group.add(mesh); return mesh;
  });
  const toothMaterial = new THREE.MeshStandardMaterial({ color: '#f4ead2', roughness: .7 });
  const teeth = new THREE.Group(); teeth.name = `${rig.character}-teeth`; group.add(teeth);
  const crownGeometry = toothGeometry(contract.teeth);
  for (const x of contract.teeth.centers) {
    const tooth = new THREE.Mesh(crownGeometry, toothMaterial); tooth.position.x = x; teeth.add(tooth);
  }
  const tongueMaterial = new THREE.MeshStandardMaterial({ color: '#b96c72', roughness: .9 });
  const tongueGeometry = new THREE.SphereGeometry(1, 16, 12);
  // Fixed anatomy dimensions, set once. Tongue poses use rotation/translation.
  tongueGeometry.scale(contract.halfWidth * .38, contract.opening * .11, contract.depth * .25);
  const tongue = new THREE.Mesh(tongueGeometry, tongueMaterial); group.add(tongue);
  const markers = { upperLip: new THREE.Object3D(), lowerLip: new THREE.Object3D() };
  Object.entries(markers).forEach(([name, node]) => { node.name = name; group.add(node); });
  function update(state, { emotion = 'neutral', intensity = 1 } = {}) {
    const boundedIntensity = THREE.MathUtils.clamp(intensity, .65, 1);
    const weights = { ...state.weights };
    const expression = emotion === 'friendly' ? .7 : emotion === 'worried' ? -.5 : 0;
    // Scale opening through a rest blend, preserving closed consonants.
    for (const mesh of surfaces) {
      mesh.morphTargetInfluences.fill(0);
      for (const [name, weight] of Object.entries(weights)) mesh.morphTargetInfluences[mesh.morphTargetDictionary[name]] = weight * boundedIntensity;
      mesh.morphTargetInfluences[mesh.morphTargetDictionary[expression >= 0 ? 'smile' : 'frown']] = Math.abs(expression);
    }
    const pose = { width: 0, open: 0, pucker: 0 };
    for (const [name, weight] of Object.entries(weights)) for (const channel of Object.keys(pose)) pose[channel] += (VISEMES[name][channel] || 0) * weight * boundedIntensity;
    pose.width += VISEMES.X.width * (1 - boundedIntensity);
    const upper = rim(contract, pose, Math.PI / 2, expression), lower = rim(contract, pose, Math.PI * 1.5, expression);
    markers.upperLip.position.fromArray(upper); markers.lowerLip.position.fromArray(lower);
    teeth.visible = pose.open > .11 && !['E', 'F'].includes(state.shape);
    teeth.position.set(0, upper[1] - contract.teeth.size[1] * .51, upper[2] - .011);
    tongue.visible = pose.open > .40;
    tongue.position.set(0, lower[1] + .008 + contract.opening * .20 * state.tongue, lower[2] - .012);
    tongue.rotation.x = -.25 * state.tongue;
    return { ...state, open: pose.open, expression, lipGap: upper[1] - lower[1] };
  }
  update(visemeAt([], 0));
  return { group, contract, surfaces, teeth, tongue, markers, update, dispose() {
    group.removeFromParent(); original.visible = originalVisible;
    if (rig.visual.jaw) rig.visual.jaw.visible = jawVisible;
    group.traverse(node => { if (node.isMesh) node.geometry.dispose(); });
    [skinMaterial, dark, edge, toothMaterial, tongueMaterial].forEach(material => material.dispose());
  } };
}
