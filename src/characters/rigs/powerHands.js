import * as THREE from 'three';
import { meshVolumes } from './collision.js';

// Explicit optional horror anatomy state. Permanent paws, anchors and segment
// lengths remain unchanged; fixed-size digits pop into view and unfold.
export const POWER_HAND_CONTRACT = Object.freeze({
  character: 'balu', version: 1, proximal: [.10, .13, .12, .09],
  distal: [.09, .11, .10, .08], radius: .026,
  limits: { proximal: [-1.65, .75], fan: [-.85, .1], distal: [0, .7] },
  transition: 'concealed → staggered reveal → open; no bone scaling'
});

export function createBaluPowerHands(rig) {
  if (rig.character !== 'balu') throw new Error('Power hands require Balu anatomy');
  const fur = rig.visual.body.material;
  const nail = new THREE.MeshStandardMaterial({ color: '#251c24', roughness: .55 });
  const hands = {};
  const baseVolumes = [...rig.collision.volumes];
  const fingerVolumes = [];
  for (const side of ['left', 'right']) {
    const root = new THREE.Group(); root.name = `power-${side}`;
    rig.hands[side].wrist.add(root);
    const digits = [];
    for (let i = 0; i < 4; i++) {
      const part = `power-${side}-${i}`;
      const proximal = new THREE.Group(); proximal.position.set((i - 1.5) * .064, -.165, .025);
      root.add(proximal);
      const length = POWER_HAND_CONTRACT.proximal[i];
      const segment = new THREE.Mesh(new THREE.CapsuleGeometry(.026, length - .052, 3, 8), fur);
      segment.position.y = -length / 2; proximal.add(segment);
      const distal = new THREE.Group(); distal.position.y = -length; proximal.add(distal);
      const endLength = POWER_HAND_CONTRACT.distal[i];
      const end = new THREE.Mesh(new THREE.CapsuleGeometry(.023, endLength - .046, 3, 8), fur);
      end.position.y = -endLength / 2; distal.add(end);
      const claw = new THREE.Mesh(new THREE.ConeGeometry(.020, .05, 8), nail);
      claw.position.y = -endLength - .015; claw.rotation.z = Math.PI; distal.add(claw);
      const contact = new THREE.Group(); contact.position.y = -endLength - .04; distal.add(contact);
      digits.push({ proximal, distal, contact, part });
      // Each fixed digit is one convex-part union attached directly to its paw.
      fingerVolumes.push({digit:proximal,root,volumes:meshVolumes(proximal,part)});
      rig.collision.exceptions.add([part, `${side}Wrist`].sort().join('|'));
    }
    hands[side] = { root, digits, indexTip: digits[0].contact };
  }
  function update(reveal, writing = 0, holdingBook = 0) {
    for (const [side, hand] of Object.entries(hands)) {
      hand.root.visible = reveal > 0;
      hand.digits.forEach((digit, i) => {
        digit.proximal.visible = reveal > .12 + i * .18;
        const p = THREE.MathUtils.clamp((reveal - i * .18) / .28, 0, 1);
        digit.proximal.rotation.x = .35 * (1 - p) - .08 * p;
        digit.proximal.rotation.z = side === 'left' ? -.8 * holdingBook : 0;
        digit.distal.rotation.x = .06;
        if (side === 'right' && writing > 0) {
          digit.proximal.rotation.x = i === 0 ? .75 * writing - .08 * (1 - writing) : .45 * writing - .08;
          digit.distal.rotation.x = i === 0 ? .06 * (1 - writing) : .35 * writing;
        }
      });
    }
    rig.collision.volumes = baseVolumes.concat(fingerVolumes.filter(entry =>
      entry.root.visible && entry.digit.visible).flatMap(entry => entry.volumes));
  }
  update(0);
  return { hands, contract: POWER_HAND_CONTRACT, update };
}
