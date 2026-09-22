import * as THREE from 'three';
import { smooth } from '../intro/timing.js';

// Canvas typography is rendered in the Three.js canvas and included in MP4 export.
export const TITLES = [
  [2, 5, 'A BEAR.', 'MADE OF CODE.', '#ffda63'],
  [5, 9.2, "I'M BALU.", 'NICE TO MEET YOU.', '#ffda63'],
  [9.2, 11.15, '100% CODE.', '100% PERSONALITY.', '#7af3cf'],
  [11.15, 13, 'WAIT… WHAT?', '', '#ffda63'],
  [13, 16.4, 'BUILT DIFFERENT.', 'LITERALLY.', '#7af3cf'],
  [18.8, 23.5, 'LEADING BEAR.', 'COMING TO A WEB SERIES.', '#ffda63'],
  [23.5, 25.9, 'YOUR NEXT', 'WEB-SERIES HERO.', '#ffda63'],
  [25.9, 28.2, 'THE STORY STARTS HERE.', '', '#ffda63'],
  [28.2, 30, 'WE GOOD?', '', '#ffda63'],
  [30, 31, 'OKAY.', '', '#7af3cf'],
  [31, 31.7, 'OKAY. OKAY.', '', '#7af3cf'],
  [31.7, 33.4, 'BYE, HUMAN.', 'SEE YOU IN THE SERIES.', '#ffda63']
];
export const CAPTIONS = [
  [2.55, 3.45, 'HELLO?!', '', '#fff8e8'],
  [3.45, 4.15, 'EXCUSE ME.', '', '#fff8e8'],
  [4.15, 5.05, 'ARE YOU LISTENING?', '', '#fff8e8'],
  [5.1, 6.9, 'MY NAME IS BALU.', '', '#fff8e8'],
  [7, 9.1, "I'M AN INDIAN BEAR.", '', '#fff8e8'],
  [9.25, 11.1, 'PROGRAMMATICALLY CREATED.', '', '#7af3cf'],
  [11.2, 12.95, 'YOU KNOW WHAT THAT MEANS?', '', '#fff8e8'],
  [13, 16.2, 'const balu = new Bear();', 'WRITTEN COMPLETELY IN CODE.', '#7af3cf'],
  [16.4, 18, 'YOU ARE GETTING?', '', '#fff8e8'],
  [18.9, 20.05, 'ONE MORE THING…', '', '#fff8e8'],
  [20.1, 23.5, "I'M GOING TO BE THE HERO.", '', '#ffda63'],
  [24, 25.8, 'EVERYBODY SHOULD WATCH.', '', '#fff8e8'],
  [25.9, 28.2, '+ FOLLOW BALU', 'FOR THE UPCOMING SERIES', '#ffda63'],
  [28.2, 29.9, "YOU'RE UNDERSTANDING?", '', '#fff8e8']
];

function textureFor(primary, secondary, accent, kind) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (kind === 'caption') {
    ctx.fillStyle = '#12271ff0';
    ctx.beginPath(); ctx.roundRect(8, 12, 1184, 216, 35); ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 5; ctx.stroke();
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const draw = (text, y, size, color) => {
    ctx.font = `900 ${size}px Arial, sans-serif`;
    while (ctx.measureText(text).width > 1090) {
      size -= 2; ctx.font = `900 ${size}px Arial, sans-serif`;
    }
    ctx.strokeStyle = '#12271f'; ctx.lineWidth = kind === 'title' ? 15 : 6;
    ctx.strokeText(text, 600, y);
    ctx.fillStyle = color; ctx.fillText(text, 600, y);
  };
  draw(primary, secondary ? 78 : 120, kind === 'title' ? (secondary ? 126 : 150) : (secondary ? 84 : 110), secondary && kind === 'title' ? '#fff8e8' : accent);
  if (secondary) draw(secondary, 180, kind === 'title' ? 88 : 45, accent);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGraphics(scene, camera) {
  scene.add(camera);
  const entries = [];
  for (const [kind, cues, y, width] of [['title', TITLES, .79, .88], ['caption', CAPTIONS, -.63, .83]]) {
    for (const [start, end, primary, secondary, accent] of cues) {
      const material = new THREE.MeshBasicMaterial({
        map: textureFor(primary, secondary, accent, kind), color: '#ffffff',
        transparent: true, depthTest: false, depthWrite: false, toneMapped: false
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, .2), material);
      mesh.renderOrder = 1000; camera.add(mesh);
      entries.push({ mesh, start, end, y, width, kind });
    }
  }
  function update(time) {
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * .8;
    const viewWidth = height * 9 / 16;
    for (const entry of entries) {
      const { mesh, start, end, width, y, kind } = entry;
      mesh.visible = time >= start && time < end;
      const age = time - start;
      const pop = kind === 'title' ? 1 + .1 * Math.sin(Math.min(1, Math.max(0, age / .28)) * Math.PI) : 1;
      mesh.scale.setScalar(viewWidth * width * pop);
      mesh.position.set(-viewWidth * .015, height * y / 2 - height * .025 * (1 - smooth(age / .18)), -.8);
      mesh.material.opacity = smooth(age / .08) * (1 - smooth((time - end + .08) / .08));
    }
  }
  return { entries, update };
}
