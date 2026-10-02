import * as THREE from 'three';
import { createCharacterRig } from '../characters/rigs/createCharacterRig.js';
import { createHoneycomb } from '../props/honeycomb.js';
import { createBaluPickUp } from '../characters/actions/balu/pickUp.js';
import {createRabbitReachStudy} from '../characters/actions/rabbit/reachStudy.js';
import {meshVolumes} from '../characters/rigs/collision.js';
import './style.css';
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x202d38);
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
camera.position.set(3.2, 2.5, 5); camera.lookAt(0, 1, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.querySelector('#view').append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xd7edff, 0x69503b, 2));
const key = new THREE.DirectionalLight(0xffe0b5, 3); key.position.set(3, 5, 4); scene.add(key);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0x46554c }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -0.01; scene.add(floor);
const grid = new THREE.GridHelper(10, 20, 0x63796b, 0x536258); scene.add(grid);
const rig = createCharacterRig('balu'); scene.add(rig.root);
const rabbitRig = createCharacterRig('rabbit'); scene.add(rabbitRig.root); rabbitRig.root.visible = false;
const character = document.getElementById('character');
character.onchange = () => { const balu=character.value==='balu'; rig.root.visible=balu; rabbitRig.root.visible=!balu;prop.visible=balu; support.visible=balu; rebuild(); };
const prop = createHoneycomb({ position: { x: 0.65, y: 0.12, z: 0.95 }, scale: 0.46 });
prop.rotation.x = -Math.PI / 2; scene.add(prop);
const controls = Object.fromEntries(['play', 'reset', 'time', 'state', 'duration', 'effort', 'hesitation'].map(id => [id, document.getElementById(id)]));
const support=new THREE.Mesh(new THREE.BoxGeometry(.5,.0786,.42),new THREE.MeshStandardMaterial({color:0x7e6954}));
support.position.set(.65,.0393,.95);scene.add(support);
const blocker=new THREE.Mesh(new THREE.BoxGeometry(.3,.6,.35),new THREE.MeshStandardMaterial({color:0xad4b42,transparent:true,opacity:.65}));
blocker.position.set(.7,.65,.5);scene.add(blocker);blocker.visible=false;
const overlays=[];
for(const r of [rig,rabbitRig])for(const volume of r.collision.volumes){
  const overlay=new THREE.Mesh(volume.node.geometry,new THREE.MeshBasicMaterial({color:0x59ddff,wireframe:true,depthTest:false,transparent:true,opacity:.35}));
  volume.node.add(overlay);overlay.visible=false;overlays.push(overlay);
}
document.getElementById('volumes').onchange=e=>{overlays.forEach(o=>o.visible=e.target.checked);render();};
document.getElementById('blocked').onchange=e=>{blocker.visible=e.target.checked;rebuild();};
document.getElementById('camera').onchange=e=>{camera.position.set(...({three:[3.2,2.5,5],front:[0,1.8,6],side:[6,1.8,0]}[e.target.value]));camera.lookAt(0,1,0);render();};
let action, playing = false, time = 0;
function rebuild() {
  action?.dispose(); time = 0; playing = false; controls.play.textContent = 'Play';
  const obstacles=blocker.visible?meshVolumes(blocker,'blocker'):[];
  action = character.value==='balu'
    ? createBaluPickUp({ rig, prop, obstacles:[...meshVolumes(support,'support'),...obstacles], duration: +controls.duration.value, effort: +controls.effort.value, hesitation: +controls.hesitation.value })
    : createRabbitReachStudy({rig:rabbitRig,obstacles,duration:+controls.duration.value});
  controls.effort.disabled=controls.hesitation.disabled=character.value==='rabbit';
  controls.time.max = action.duration + 1; render();
}
function render() {
  const state = action.update(time); controls.time.value = time;
  controls.state.textContent = `${time.toFixed(2)}s · ${state.phase} · ${state.attached ? 'carried' : 'on ground'} · reach error ${((state.reachError??0) * 100).toFixed(1)} cm`;
  if(character.value==='rabbit')controls.state.textContent=`${time.toFixed(2)}s · ${state.phase} · diagnostic motion`;
  if(state.failure)controls.state.textContent=`Blocked plan at ${state.failure.at?.toFixed(2)??time.toFixed(2)}s: ${state.failure.hits?.map(h=>h.a+' / '+h.b).join(', ')??'unreachable contact'}`;
  renderer.render(scene, camera);
}
controls.play.onclick = () => { if (time >= +controls.time.max) time = 0; playing = !playing; controls.play.textContent = playing ? 'Pause' : 'Play'; };
controls.reset.onclick = () => { playing = false; time = 0; controls.play.textContent = 'Play'; render(); };
controls.time.oninput = () => { playing = false; controls.play.textContent = 'Play'; time = +controls.time.value; render(); };
for (const id of ['duration', 'effort', 'hesitation']) controls[id].oninput = rebuild;
function resize() { const el = document.querySelector('#view'); renderer.setSize(el.clientWidth, el.clientHeight); camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix(); if (action) render(); }
window.addEventListener('resize', resize); resize(); rebuild();
let previous;
renderer.setAnimationLoop(now => { const dt = previous === undefined ? 0 : Math.min((now - previous) / 1000, 0.05); previous = now;
  if (playing) { time = Math.min(time + dt, +controls.time.max); if (time >= +controls.time.max) { playing = false; controls.play.textContent = 'Play'; } render(); }
});
