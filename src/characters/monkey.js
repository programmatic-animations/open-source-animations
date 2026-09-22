import * as THREE from 'three';

// Optional facial acting belongs to this character; no animated mouth is baked in.
export function createMonkey() {
  const monkey = new THREE.Group();
  const brown = new THREE.MeshStandardMaterial({ color: '#885134', roughness: .9 });
  const tan = new THREE.MeshStandardMaterial({ color: '#e0ad77', roughness: .9 });
  const dark = new THREE.MeshStandardMaterial({ color: '#231b17' });
  const white = new THREE.MeshStandardMaterial({ color: '#fff8e7' });
  function ball(parent, material, size, position, scale = [1,1,1]) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 16), material);
    mesh.position.set(...position); mesh.scale.set(...scale); parent.add(mesh); return mesh;
  }
  const body = ball(monkey, brown, .43, [0,.79,0], [.82,1.2,.72]);
  ball(monkey, tan, .3, [0,.79,.23], [.85,1.15,.3]);
  const head = new THREE.Group(); head.position.y = 1.48; monkey.add(head);
  ball(head, brown, .39, [0,0,0]);
  [-1,1].forEach(s => { ball(head,brown,.21,[s*.39,.025,0],[1,1,.5]); ball(head,tan,.145,[s*.41,.025,.085],[1,1,.35]); });
  ball(head,tan,.31,[0,-.025,.19],[1,.95,.65]);
  ball(head,tan,.21,[0,-.14,.36],[1.1,.65,.65]);
  ball(head,dark,.045,[0,-.07,.485],[1.2,.65,.7]);
  const eyes = [-1,1].map(s => {
    const eye = ball(head,white,.091,[s*.13,.07,.35],[.85,1,.55]);
    ball(eye,dark,.048,[0,0,.088],[.85,1,.65]);
    ball(eye,white,.012,[-.014,.02,.122]); return eye;
  });
  const brows = [-1,1].map(s => {
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(.018,.105,4,8),brown);
    brow.position.set(s*.13,.195,.37); brow.rotation.z = Math.PI/2; head.add(brow); return brow;
  });
  function limb(x,y,length,radius) {
    const pivot = new THREE.Group(); pivot.position.set(x,y,0); monkey.add(pivot);
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius,length-radius*2,6,12),brown);
    mesh.position.y = -length/2; pivot.add(mesh);
    ball(pivot,tan,radius*1.2,[0,-length,0],[1,1,1.2]); return pivot;
  }
  const leftArm=limb(-.34,1.08,.63,.075), rightArm=limb(.34,1.08,.63,.075);
  const leftLeg=limb(-.19,.5,.4,.095), rightLeg=limb(.19,.5,.4,.095);
  const tail = new THREE.CatmullRomCurve3([[0,.58,-.22],[.13,.56,-.66],[.4,.8,-.85],[.55,1.14,-.77],[.4,1.3,-.64],[.28,1.17,-.63]].map(p=>new THREE.Vector3(...p)));
  monkey.add(new THREE.Mesh(new THREE.TubeGeometry(tail,40,.055,10,false),brown));
  return { monkey, body, head, eyes, brows, leftArm, rightArm, leftLeg, rightLeg };
}
