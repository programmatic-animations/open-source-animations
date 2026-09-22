import * as THREE from 'three';

// Episode-local expression and running additions; the shared rabbit stays unchanged.
export function createRabbitActing(rabbit) {
  const dark = new THREE.MeshStandardMaterial({ color: 0x251e1b, roughness: 1 });
  const brows = [-1, 1].map(side => {
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.021, 0.13, 3, 8), dark);
    brow.position.set(side * 0.15, 0.23, 0.39); brow.rotation.z = Math.PI / 2;
    rabbit.headGroup.add(brow); return brow;
  });
  const feet = [-1, 1].map(side => {
    const pivot = new THREE.Group(); pivot.position.set(side * 0.22, 0.15, 0);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), rabbit.body.material);
    foot.scale.set(0.8, 0.52, 1.5); foot.position.set(0, -0.075, 0.09);
    pivot.add(foot); rabbit.rabbit.add(pivot); return pivot;
  });
  function update({ skeptical = 0, fear = 0, running = 0, phase = 0, visible = false }) {
    brows.forEach((brow, i) => {
      brow.visible = skeptical > 0 || fear > 0;
      brow.position.y = 0.23 + (i === 0 ? skeptical * 0.095 : -skeptical * 0.025) + fear * 0.025;
      brow.rotation.z = Math.PI / 2 + (i ? 1 : -1) * (skeptical * 0.2 + fear * 0.3);
    });
    feet.forEach((foot, i) => {
      foot.visible = visible;
      const stride = Math.sin(phase + i * Math.PI) * running;
      foot.rotation.x = stride * 0.55;
      foot.position.y = 0.15 + Math.abs(stride) * 0.11;
    });
  }
  return { brows, feet, update };
}
