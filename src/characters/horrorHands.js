import * as THREE from 'three';

// Optional articulated hands: the approved shared bear factory remains unchanged.
export function createHorrorHand(arm, side) {
  const hand = new THREE.Group(); hand.name = `horror-hand-${side}`;
  hand.position.y = -0.69; arm.add(hand);
  const fur = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.88 });
  const nail = new THREE.MeshStandardMaterial({ color: 0x352a22, roughness: 0.65 });
  const fingers = [];
  const bulges = [];
  for (let i = 0; i < 5; i++) {
    const pivot = new THREE.Group();
    pivot.position.set(i === 4 ? -side * 0.13 : (i - 1.5) * 0.069, i === 4 ? 0.045 : -0.035, 0);
    hand.add(pivot);
    const length = i === 4 ? 0.17 : [0.23, 0.29, 0.27, 0.21][i];
    const digit = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, length - 0.084, 4, 8), fur);
    digit.position.y = -length / 2; pivot.add(digit);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.029, 0.075, 8), nail);
    tip.position.y = -length; tip.rotation.z = Math.PI; pivot.add(tip);
    fingers.push(pivot);
    const bulge = new THREE.Mesh(new THREE.SphereGeometry(0.049, 10, 8), fur);
    bulge.position.copy(pivot.position); hand.add(bulge); bulges.push(bulge);
  }
  function update(growth, curl = 0, point = false, tension = 0) {
    hand.visible = growth > 0 || tension > 0;
    bulges.forEach(bulge => { bulge.visible = tension > 0 && growth < 1; bulge.scale.set(1, 0.2 + tension, 1); });
    fingers.forEach((finger, i) => {
      finger.visible = growth > 0;
      finger.scale.set(0.55 + growth * 0.45, Math.max(0.001, growth), 0.55 + growth * 0.45);
      finger.rotation.set((point && i === 1 ? 0 : curl) * 1.65, 0, i === 4 ? -side * 0.95 : (i - 1.5) * 0.09 * (1 - curl));
    });
  }
  return { hand, fingers, update };
}
