import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCharacterRig} from '../src/characters/rigs/createCharacterRig.js';
import {createHoneycomb} from '../src/props/honeycomb.js';
import {createBaluPickUp} from '../src/characters/actions/balu/pickUp.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
function fixture(options={}){const scene=new THREE.Group();scene.position.set(2,1,-3);scene.rotation.y=.6;
 const rig=createCharacterRig();scene.add(rig.root);const prop=createHoneycomb({position:{x:.65,y:.12,z:.95},scale:.46});prop.rotation.x=-Math.PI/2;scene.add(prop);
 return {rig,prop,action:createBaluPickUp({rig,prop,...options})};}
test('both character rigs clamp DOFs and preserve fixed anchors',()=>{
 for(const type of ['balu','rabbit']){const rig=createCharacterRig(type);
 for(const [name,j] of Object.entries(rig.joints)){
  rig.setJoint(name,{x:100,y:-100,z:100});
  for(const axis of ['x','y','z'])assert.ok(j.node.rotation[axis]>=j.limits[axis][0]&&j.node.rotation[axis]<=j.limits[axis][1]);
  assert.ok(j.node.position.equals(j.rest));assert.deepEqual(j.node.scale.toArray(),[1,1,1]);
 }
 rig.reset();assert.equal(rig.hands.right.wrist.parent,rig.hands.right.elbow);
 assert.equal(rig.hands.right.elbow.parent,rig.hands.right.shoulder);
 assert.throws(()=>rig.setJoint('head',{x:NaN}));rig.dispose();
 }
});
test('constrained pickup keeps feet planted, grip aligned, proportions and reverse seeking stable',()=>{
 for(const settings of [{},{duration:2,effort:1,hesitation:1}]){
 const {rig,prop,action}=fixture(settings),ground=prop.position.clone();
 assert.equal(action.validation.reason,undefined,JSON.stringify(action.validation));
 let attachment;
 const feet=Object.values(rig.feet).map(f=>f.getWorldPosition(V()));
 const snapshot=t=>{const state=action.update(t);return JSON.stringify([prop.position,...Object.values(rig.joints).map(j=>j.node.quaternion),state]);};
 for(let i=0;i<=80;i++){
  const s=action.update(i/80*action.duration);assert.ok(s.reachError<.002,`${i}: ${s.reachError}`);
  for(const [index,f] of Object.values(rig.feet).entries())assert.ok(f.getWorldPosition(V()).distanceTo(feet[index])<1e-8);
  for(const j of Object.values(rig.joints)){assert.ok(j.node.position.equals(j.rest));assert.deepEqual(j.node.scale.toArray(),[1,1,1]);}
  if(s.attached){prop.updateWorldMatrix(true,false);const relative=rig.hands.right.wrist.matrixWorld.clone().invert().multiply(prop.matrixWorld);
   if(!attachment)attachment=relative.clone();
   assert.ok(relative.elements.every((v,i)=>Math.abs(v-attachment.elements[i])<1e-8));}
  else assert.ok(prop.position.equals(ground));
 }
 const expected=snapshot(1);action.update(action.duration);assert.equal(snapshot(1),expected);
 action.update(action.contactTime-1e-6);const before=prop.position.clone();action.update(action.contactTime);assert.ok(prop.position.distanceTo(before)<.002);
 const hand=rig.hands.right.wrist;action.dispose();assert.equal(rig.hands.right.wrist,hand);assert.ok(prop.position.equals(ground));
 }
});
test('unreachable pickup reports failure and does not teleport prop',()=>{
 const {rig,prop,action}=fixture();action.dispose();prop.position.set(8,.1,8);const a=createBaluPickUp({rig,prop});
 const original=prop.position.clone(),s=a.update(a.contactTime);assert.equal(s.attached,false);assert.equal(s.phase,'unreachable');assert.ok(prop.position.equals(original));
 assert.equal(a.update(a.duration).attached,false);assert.ok(prop.position.equals(original));
});
