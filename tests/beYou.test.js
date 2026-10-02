import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createBeYouScene,SCENE_CONFIG } from '../src/tiktok/beYou/scene.js';
import { DIALOGUE } from '../src/tiktok/beYou/dialogue.js';
import { TIKTOK_VIDEOS } from '../src/tiktok/catalog.js';
import { checkCollisions,meshVolumes } from '../src/characters/rigs/collision.js';
import { applyVideoFraming,resolveVideoFormat } from '../src/runtime/videoFormat.js';
import { getShotAt } from '../src/runtime/shotTimeline.js';

function setup(){const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();return{scene,camera,draft:createBeYouScene({scene,camera})};}
test('Be You preserves the user script and dialogue timing while adding visual inserts',()=>{
  assert.equal(TIKTOK_VIDEOS.at(-1).id,'tiktok-be-you');
  assert.equal(SCENE_CONFIG.shots.length,13);assert(Math.abs(SCENE_CONFIG.duration-30)<1e-9);
  assert.deepEqual(DIALOGUE.map(line=>line.text),['Bro, how to get a girlfriend bro?','Brother, best way to get a girlfriend is to be yourself.','Be myself?',"Yes, don't hold back.",'Vokey','Brooo, you should totally be someone else!']);
  for(const line of DIALOGUE){const shot=SCENE_CONFIG.shots.find(shot=>shot.id===line.shotId);assert(line.start>=shot.start&&line.end<=shot.end);}
});
test('all poses, props, facial effects, lighting and camera cuts seek reversibly',()=>{
  const {scene,camera,draft}=setup();
  function capture(t){draft.update(t);applyVideoFraming(camera,resolveVideoFormat('vertical'),getShotAt(SCENE_CONFIG.shots,t).shot);
    const nodes=[];scene.traverse(node=>{const pose=[...node.position.toArray(),...node.quaternion.toArray(),...node.scale.toArray()];assert(pose.every(Number.isFinite));nodes.push([pose,node.visible,node.geometry?.drawRange.count===Infinity?'all':node.geometry?.drawRange.count,node.material?.opacity,node.intensity]);});
    return JSON.stringify([nodes,camera.matrixWorld.toArray(),scene.background.toArray(),draft.getNotebookState(),draft.effects.flames[0].material.uniforms.uStrength.value]);
  }
  for(const shot of SCENE_CONFIG.shots)for(const t of[shot.start,shot.start+shot.duration*.5,shot.end-.001]){const expected=capture(t);capture(30);capture(0);assert.equal(capture(t),expected);}
});
test('dense full-story samples keep rigid anatomy, solid volumes and planted feet clear',()=>{
  const {draft}=setup(),rigs=[draft.actors.balu,...draft.actors.rabbits],note=draft.actors.notebook;
  assert.equal(draft.actors.notebookAction.validation.reason,undefined);
  const props=[...meshVolumes(note.cover,'notebook'),...meshVolumes(note.grip,'notebook'),...meshVolumes(note.pen,'pencil'),...meshVolumes(note.storage,'belt-loop')];
  for(let i=0;i<=1800;i++){const t=i/60;draft.update(t);
    for(const [index,rig]of rigs.entries()){
      assert.deepEqual(checkCollisions(rig,index?{}:{propVolumes:props}),[],`collision at ${t}, actor ${index}`);
      for(const joint of Object.values(rig.joints)){assert(joint.node.position.distanceTo(joint.rest)<1e-10);assert.deepEqual(joint.node.scale.toArray(),[1,1,1]);for(const axis of['x','y','z'])assert(joint.node.rotation[axis]>=joint.limits[axis][0]-1e-8&&joint.node.rotation[axis]<=joint.limits[axis][1]+1e-8);}
      for(const foot of Object.values(rig.feet))assert(Math.abs(foot.getWorldPosition(new THREE.Vector3()).y)<1e-8);
    }
    const {contract,hands}=draft.actors.powerHands;
    for(const hand of Object.values(hands))for(const [digitIndex,digit]of hand.digits.entries()){
      assert.deepEqual(digit.proximal.position.toArray(),[(digitIndex-1.5)*.064,-.165,.025]);
      assert.equal(digit.distal.position.y,-contract.proximal[digitIndex]);
      assert.equal(digit.contact.position.y,-contract.distal[digitIndex]-.04);
      for(const node of[digit.proximal,digit.distal])assert.deepEqual(node.scale.toArray(),[1,1,1]);
      for(const [angle,limits]of [[digit.proximal.rotation.x,contract.limits.proximal],[digit.proximal.rotation.z,contract.limits.fan],[digit.distal.rotation.x,contract.limits.distal]])assert(angle>=limits[0]&&angle<=limits[1]);
    }
  }
});
test('force stops on rabbits before the notebook; actual pen contact completes the cross-out',()=>{
  const {draft}=setup();draft.update(13.8);assert(draft.actors.powerHands.hands.right.root.visible);
  draft.update(17);assert(draft.effects.aura.visible);assert(draft.actors.faces[0].eyes[0].fire.visible);
  draft.update(23.2);assert(!draft.effects.aura.visible);assert(draft.actors.rabbits[0].joints.torso.node.rotation.x>.1);
  draft.update(24.99);assert(draft.actors.rabbits[0].joints.torso.node.rotation.x<.001);assert(!draft.getNotebookState().attached);
  let maxError=0;for(let i=0;i<=120;i++){draft.update(27.05+i*.67/120);const state=draft.getNotebookState();assert(state.attached);maxError=Math.max(maxError,state.tipError);assert(state.contactError<.002);}
  assert(maxError<.012,`pen left the paper by ${maxError}`);
  draft.update(30);assert.equal(draft.getNotebookState().progress,1);assert.equal(draft.actors.notebook.strike.geometry.drawRange.count,2304);assert(draft.actors.faces[0].eyes[0].pupil.position.y<-.015);
});
test('speaking heads and muzzles stay inside portrait throughout each dialogue window',()=>{
  const {camera,draft}=setup();
  for(const line of DIALOGUE)for(let i=0;i<=20;i++){
    const t=line.start+(line.end-line.start)*i/20;draft.update(t);applyVideoFraming(camera,resolveVideoFormat('vertical'),getShotAt(SCENE_CONFIG.shots,t).shot);
    const rig=line.speaker==='Balu'?draft.actors.balu:draft.actors.rabbits[0];
    const box=new THREE.Box3().setFromObject(rig.visual.headGroup);
    for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<.99&&Math.abs(p.y)<.99,`${line.shotId} crops the speaking head`);}
  }
});
