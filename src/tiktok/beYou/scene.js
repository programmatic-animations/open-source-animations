import * as THREE from 'three';
import { createCharacterRig } from '../../characters/rigs/createCharacterRig.js';
import { createGround } from '../../environment/ground.js';
import { createBaluPowerHands } from '../../characters/rigs/powerHands.js';
import { createRabbitWindBrace } from '../../characters/actions/rabbit/windBrace.js';
import { createBaluNotebookAction } from '../../characters/actions/balu/notebook.js';
import { smoothPhase,fitSegment } from '../../characters/actions/mechanics.js';
import { updateShot } from '../../runtime/shotTimeline.js';
import { SHOTS, DURATION, CUES } from './shots.js';
import { createBaluPerformance, createRabbitConversation, dialogueState } from './performance.js';
import { createFace, blinkAt } from './face.js';
import { createPowerEffects } from './effects.js';
import { createNotebook } from './notebook.js';

export const SCENE_CONFIG = {
  id: 'tiktok-be-you-main', title: 'Be You · first animation draft',
  duration: DURATION, shots: SHOTS, seekable: true
};

// One shared location and absolute-time lighting across every cut.
function createClearing(scene) {
  scene.background = new THREE.Color('#b6c9bc');
  scene.fog = new THREE.Fog('#b6c9bc', 13, 32);
  const ambient=new THREE.HemisphereLight('#fff6df', '#455f43', 2.2);scene.add(ambient);
  const key = new THREE.DirectionalLight('#ffe2b9', 3);
  key.position.set(-4, 7, 6); scene.add(key);
  const rim = new THREE.DirectionalLight('#dfecff', 1.8);
  rim.position.set(3, 5, -4); scene.add(rim);
  const ground = createGround({ size: 60, color: '#779465' });
  ground.position.y = -.015; scene.add(ground);
  const bark = new THREE.MeshStandardMaterial({ color: '#675342', roughness: 1 });
  const foliage = new THREE.MeshStandardMaterial({ color: '#456c4b', roughness: 1 });
  for (let i = 0; i < 12; i++) {
    const x = (i % 6 - 2.5) * 2.8;
    const z = -6 - Math.floor(i / 6) * 6;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18, .25, 4, 8), bark);
    trunk.position.set(x, 2, z); scene.add(trunk);
    for(let layer=0;layer<3;layer++){
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25-layer*.13,1), foliage);
      crown.position.set(x+.25*Math.sin(i+layer),3.6+layer*.65,z);
      crown.scale.set(1.15,.85,1);scene.add(crown);
    }
  }
  const path=new THREE.Mesh(new THREE.CircleGeometry(3.9,64),new THREE.MeshStandardMaterial({color:'#a6a17a',roughness:1}));
  path.rotation.x=-Math.PI/2;path.position.set(.25,-.009,.3);path.scale.y=.68;scene.add(path);
  return {ambient,key,rim,background:new THREE.Color('#b6c9bc')};
}

export function createBeYouScene({ scene, camera }) {
  const location=createClearing(scene);
  const balu = createCharacterRig('balu');
  const rabbits = [createCharacterRig('rabbit'), createCharacterRig('rabbit')];
  balu.root.position.set(-.95, 0, 0);
  balu.root.rotation.y = .22;
  rabbits.forEach((rig, index) => {
    rig.root.position.set(2.0 + index * .85, 0, -index * .65);
    rig.root.rotation.y = -.28;
  });
  scene.add(balu.root, ...rabbits.map(rig => rig.root));
  const powerHands=createBaluPowerHands(balu);
  const faces=[createFace(balu),...rabbits.map(createFace)];
  const baluPerformance=createBaluPerformance(balu);
  const rabbitPerformance=rabbits.map(createRabbitConversation);
  const wind=rabbits.map((rig,index)=>createRabbitWindBrace(rig,{start:CUES['aura-release'],stop:CUES['rabbit-recovery'],delay:index*.06}));
  const effects=createPowerEffects(scene,balu);
  const notebook=createNotebook();balu.root.add(notebook.book);balu.hands.right.wrist.add(notebook.pen);
  const notebookAction=createBaluNotebookAction({rig:balu,notebook,powerHands});
  // The pad hangs from a real belt loop before the paw takes ownership.
  notebook.book.updateMatrix();
  const clip=notebook.grip.children[0].position.clone().applyMatrix4(notebook.book.matrix);
  const clipNormal=new THREE.Vector3(0,0,1).applyQuaternion(notebook.book.quaternion);
  const tetherCurve=new THREE.CubicBezierCurve3(new THREE.Vector3(-.62,.72,.35),new THREE.Vector3(-.95,.30,.45),clip.clone().addScaledVector(clipNormal,.30),clip.clone());
  notebook.storage=new THREE.Group();
  const tetherMaterial=new THREE.MeshStandardMaterial({color:'#4b6556',roughness:1});
  const tetherSegments=Array.from({length:16},()=>{const segment=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,1,6),tetherMaterial);notebook.storage.add(segment);return segment;});
  notebook.storage.name='notebook-belt-loop';balu.root.add(notebook.storage);
  const actors={balu,rabbits,powerHands,faces,notebook,notebookAction};
  for(const rig of [balu,...rabbits]){
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(.45,48),new THREE.MeshBasicMaterial({color:'#344332',transparent:true,opacity:.24,depthWrite:false}));
    shadow.rotation.x=-Math.PI/2;shadow.position.set(rig.root.position.x,-.006,rig.root.position.z+.04);shadow.scale.y=.65;scene.add(shadow);
  }
  let notebookState;

  function update(time) {
    const t = THREE.MathUtils.clamp(time, 0, DURATION);
    const state=dialogueState(t);
    const detach=smoothPhase(t,CUES['notebook-tag']+.35,CUES['notebook-tag']+.43);
    const drop=smoothPhase(t,CUES['notebook-tag']+.43,CUES['notebook-tag']+.65);
    // Unhook outward before dropping; a diagonal shortcut crosses the wrist.
    tetherCurve.v3.copy(clip).addScaledVector(clipNormal,.25*detach).addScaledVector(new THREE.Vector3(0,-.35,0),drop);
    tetherCurve.v2.copy(tetherCurve.v3).addScaledVector(clipNormal,.30*(1-drop));
    tetherSegments.forEach((segment,i)=>fitSegment(segment,tetherCurve.getPoint(i/16),tetherCurve.getPoint((i+1)/16)));
    baluPerformance(t);powerHands.update(state.reveal);
    if(t>=CUES['notebook-tag']){
      notebookState=notebookAction.update(t-CUES['notebook-tag']);
      // Eyes react first; head follows only after the cross-out is finished.
      balu.setJoint('head',{x:.15+.13*smoothPhase(t,28.55,29.2),z:.025*state.sad});
    }else{
      notebook.book.position.copy(notebookAction.source);notebook.book.quaternion.copy(notebookAction.sourceQ);notebook.book.scale.set(1,1,1);notebook.update(0);
      notebookState={attached:false,progress:0};
    }
    faces[0].update({time:t,gaze:t<12.5?.8:0,question:state.question,
      confidence:state.acceptance,sad:state.sad,fire:state.fire,
      smiling:state.acceptance*smoothPhase(t,12.5,13.2),blink:blinkAt(t,[3.35,8.15,11.4,24.6,28.3])});
    rabbits.forEach((rig,index)=>{
      rabbitPerformance[index](t);
      const windState=t>=CUES['aura-release']?wind[index](t):{force:0,brace:0};
      faces[index+1].update({time:t,gaze:-.9,confidence:(1-windState.brace)*.65,
        fear:windState.brace,question:index?state.question*.3:0,
        blink:blinkAt(t,[2.8+index*.15,8.0+index*.1,11.5+index*.12,24.45+index*.1])});
    });
    const strength=effects.update(t,{start:CUES['aura-release'],stop:CUES['rabbit-recovery']});
    location.ambient.intensity=2.2-strength*.85;
    location.key.intensity=3-strength*.8;
    location.rim.intensity=1.8+strength*1.5;
    scene.background.copy(location.background).lerp(new THREE.Color('#253047'),strength*.72);
    scene.fog.color.copy(scene.background);
    scene.updateMatrixWorld(true);
    updateShot(SHOTS,t,{camera,sceneTime:t,actors,effects});
    camera.updateMatrixWorld(true);
  }
  update(0);
  return {config:SCENE_CONFIG,update,actors,effects,location,getNotebookState:()=>notebookState};
}
