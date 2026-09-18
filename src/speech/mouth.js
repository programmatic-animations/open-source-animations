import * as THREE from 'three';
export function createMouth() {
  const group = new THREE.Group();
  const material = color => new THREE.MeshBasicMaterial({ color });
  const oval = (color, z) => {
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 64), material(color));
    mesh.position.z = z; group.add(mesh); return mesh;
  };
  const lips = oval('#773330', 0);
  const cavity = oval('#210e18', 0.01);
  const teeth = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material('#fff4dc'));
  teeth.position.z = 0.02; group.add(teeth);
  const tongue = oval('#e98289', 0.03);
  return { group, update([width, open, tooth, tongueAmount]) {
    lips.scale.set(width + 0.07, open + 0.065, 1);
    cavity.scale.set(width, open, 1);
    teeth.visible = tooth > 0.1 && open > 0.07;
    teeth.scale.set(width * 1.3, Math.min(open * 0.65, 0.17) * tooth, 1);
    teeth.position.y = open * 0.45;
    tongue.visible = tongueAmount > 0.1 && open > 0.2;
    tongue.scale.set(width * 0.5, open * 0.23 * tongueAmount, 1);
    tongue.position.y = -open * 0.55;
  }};
}
