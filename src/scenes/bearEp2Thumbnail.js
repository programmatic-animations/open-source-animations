import * as THREE from 'three';
import { createBear } from '../characters/bear.js';
import { createRabbit } from '../characters/rabbit.js';
import { createHoneycomb } from '../props/honeycomb.js';

export const SCENE_CONFIG = { id: 'bear-ep2-thumbnail', title: 'Episode 2 — Big Mistake', kind: 'thumbnail' };
// Deterministic Three.js poster: actual character factories, geometry, and canvas typography.
export function createBearEp2Thumbnail({ scene, camera }) {
  scene.background = new THREE.Color(0x102e3b);
  camera.position.set(0, 2.7, 12); camera.lookAt(0, 2.7, 0); camera.fov = 42; camera.updateProjectionMatrix();
  scene.add(new THREE.HemisphereLight(0xc9eaff, 0x342115, 2));
  const key = new THREE.DirectionalLight(0xffd089, 4); key.position.set(-4, 7, 6); scene.add(key);
  const rimLight = new THREE.DirectionalLight(0x72dfff, 3); rimLight.position.set(5, 4, -2); scene.add(rimLight);
  const material = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  const dark = material(0x20100b), wood = material(0x956139), rope = material(0xf0c98e);
  const mesh = (g, m, parent = scene) => { const o = new THREE.Mesh(g, m); parent.add(o); return o; };
  const rod = (parent, a, z, r, mat) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...z);
    const o = mesh(new THREE.CylinderGeometry(r, r, start.distanceTo(end), 12), mat, parent);
    o.position.copy(start).add(end).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize()); return o;
  };
  const b = createBear(); scene.add(b.bear);
  b.bear.scale.setScalar(4.3); b.bear.position.set(-3.2, -4.6, 1.8); b.bear.rotation.y = 0.14;
  b.headGroup.rotation.z = -0.08;
  b.leftArm.rotation.z = -0.6; b.rightArm.rotation.set(-0.7, 0, 1.7);
  for (const side of [-1, 1]) {
    rod(b.headGroup, [side * 0.04, 0.09, 0.48], [side * 0.3, 0.24, 0.425], 0.04, dark);
    for (let i = 0; i < 2; i++) rod(b.headGroup, [side * 0.025, 0.24 + i * 0.08, 0.46 - i * 0.035], [side * 0.12, 0.29 + i * 0.065, 0.44 - i * 0.035], 0.009, dark);
  }
  const mouth = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.17,-0.25,0.575),new THREE.Vector3(0,-0.185,0.614),new THREE.Vector3(0.17,-0.25,0.575)
  ]),24,0.021,8,false),dark,b.headGroup);
  mouth.name = 'angry-frown';
  const backgroundCanvas=document.createElement('canvas');backgroundCanvas.width=1024;backgroundCanvas.height=576;
  const bg=backgroundCanvas.getContext('2d');const glow=bg.createLinearGradient(0,0,1024,576);
  glow.addColorStop(0,'#742a1a');glow.addColorStop(0.48,'#163545');glow.addColorStop(1,'#08131e');bg.fillStyle=glow;bg.fillRect(0,0,1024,576);
  const backgroundTexture=new THREE.CanvasTexture(backgroundCanvas);backgroundTexture.colorSpace=THREE.SRGBColorSpace;
  const backdrop=mesh(new THREE.PlaneGeometry(28,16),new THREE.MeshBasicMaterial({map:backgroundTexture}));backdrop.position.set(0,2,-5);
  const cliff=mesh(new THREE.BoxGeometry(6,7,1.7),material(0x23353e));cliff.position.set(3.5,-1.6,-0.9);cliff.rotation.z=-0.08;
  const ledge = mesh(new THREE.BoxGeometry(6, 0.5, 2), material(0x4a392b)); ledge.position.set(3.5,2.15,-0.6); ledge.rotation.z = -0.08;
  const turf = mesh(new THREE.BoxGeometry(6,0.14,2.1),material(0x7f9b38)); turf.position.copy(ledge.position);turf.position.y+=0.3;turf.rotation.z=-0.08;
  [0,1].forEach(i => {
    const r=createRabbit({color:i?0xd8d8d8:0xb8a18a,bellyColor:i?0xf0eeee:0xd8cbbb});scene.add(r.rabbit);
    r.rabbit.position.set(i?4.6:2.0,2.35,-0.3);r.rabbit.scale.setScalar(1.55);r.headGroup.rotation.x=0.15;
    r.jaw.rotation.x=0.2;r.teethGroup.visible=true;
    const fur=material(i?0xd8d8d8:0xb8a18a);
    for(const side of [-1,1]) {
      const end=i?[side*0.7,1.05,0.45]:[side*0.4,0.48,0.7];
      rod(r.rabbit,[side*0.36,0.85,0],end,0.105,fur);
      const paw=mesh(new THREE.SphereGeometry(0.15,12,10),fur,r.rabbit);paw.position.set(...end);
    }
    if(!i){const honey=createHoneycomb({position:{x:0,y:0.48,z:0.65},scale:0.8});r.rabbit.add(honey);
      for(const cell of honey.children){const inset=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,0.014,6),material(0xa45b05));inset.position.y=0.1;cell.add(inset);}
    }
  });
  const ladder = new THREE.Group();scene.add(ladder);ladder.position.set(2.65,1.6,0.5);ladder.rotation.z=-0.37;
  for(const side of [-1,1])rod(ladder,[side*0.55,0,0],[side*0.55,-4.1,0],0.045,rope);
  for(let i=0;i<8;i++)rod(ladder,[-0.6,-i*0.5,0],[0.6,-i*0.5,0],0.085,wood);
  const streakMaterial=new THREE.MeshBasicMaterial({color:0x638093,transparent:true,opacity:0.6});
  for(let i=0;i<4;i++)rod(scene,[1.5+i*0.52,1.4-i*0.3,0.3],[0.9+i*0.52,0.2-i*0.3,0.3],0.012,streakMaterial);
  // Camera-space overlay keeps the export composition stable at 16:9.
  const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;
  const ctx=canvas.getContext('2d');ctx.lineJoin='round';ctx.textBaseline='top';
  ctx.fillStyle='#e5412e';ctx.fillRect(42,40,200,80);ctx.font='900 58px Arial';ctx.fillStyle='white';ctx.fillText('EP 2',65,50);
  ctx.textAlign='center';ctx.font='900 142px Arial Black, Arial, sans-serif';ctx.lineWidth=22;ctx.strokeStyle='#0a151c';
  ctx.strokeText('BIG MISTAKE!',1160,42);
  const gradient=ctx.createLinearGradient(0,42,0,205);gradient.addColorStop(0,'#fff8cd');gradient.addColorStop(1,'#ffbd31');ctx.fillStyle=gradient;ctx.fillText('BIG MISTAKE!',1160,42);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const overlay=mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}),camera);
  overlay.position.z=-1;overlay.renderOrder=100;scene.add(camera);
  function update(){const h=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));overlay.scale.set(h*camera.aspect,h,1);}
  update();return {config:SCENE_CONFIG,update};
}
