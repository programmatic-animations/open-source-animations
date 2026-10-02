import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCharacterRig} from '../src/characters/rigs/createCharacterRig.js';
import {createBaluPickUp} from '../src/characters/actions/balu/pickUp.js';
import {createRabbitReachStudy} from '../src/characters/actions/rabbit/reachStudy.js';
import {createScalarTrack} from '../src/characters/actions/mechanics.js';
import {boxVolume,worldVolume,intersects,checkCollisions,surfaceDistance} from '../src/characters/rigs/collision.js';
import {createHoneycomb} from '../src/props/honeycomb.js';
const V=(...v)=>new THREE.Vector3(...v);
function fixture(){const scene=new THREE.Group(),rig=createCharacterRig(),prop=createHoneycomb({position:{x:.65,y:.12,z:.95},scale:.46});prop.rotation.x=-Math.PI/2;scene.add(rig.root,prop);return {scene,rig,prop};}
test('convex collision distinguishes contact, penetration and rotated solids',()=>{
 const space=new THREE.Group();space.updateMatrixWorld();
 const a=boxVolume('a',V(-1,-1,-1),V(1,1,1)),b=boxVolume('b',V(1,-.2,-.2),V(2,.2,.2));
 const hit=()=>{b.node.updateMatrixWorld();return intersects(worldVolume(a,space),worldVolume(b,space));};
 assert.equal(hit(),false);b.node.position.x=-.1;assert.equal(hit(),true);b.node.position.x=2;assert.equal(hit(),false);
 b.node.position.x=0;b.node.rotation.y=Math.PI/4;assert.equal(hit(),true);
});
test('neutral solids clear ground and nonconnected anatomy; exceptions are explicit',()=>{
 for(const type of ['balu','rabbit']){const rig=createCharacterRig(type);assert.deepEqual(checkCollisions(rig),[]);
 assert.ok(rig.collision.exceptions.has(['rightShoulder','rightElbow'].sort().join('|')));
 assert.ok(!rig.collision.exceptions.has(['torso','rightWrist'].sort().join('|')));
 rig.hands.right.wrist.position.set(-.4,0,0);assert.ok(checkCollisions(rig).length>0);}
});
test('pickup validates intermediate solids, surface grip and rigid ownership under reverse seeking',()=>{
 const f=fixture(),a=createBaluPickUp(f);assert.equal(a.validation.reason,undefined);assert.ok(a.contactSurfaceError<.025);
 for(let i=0;i<=240;i++){const state=a.update(i/60);assert.notEqual(state.phase,'blocked');assert.deepEqual(checkCollisions(f.rig,{propVolumes:[]}),[]);}
 a.update(a.contactTime);assert.ok(surfaceDistance(f.prop,f.rig.hands.right.contact.getWorldPosition(V()))<.025);
 a.update(1.3);const position=f.rig.hands.right.wrist.getWorldPosition(V());
 a.dispose();const obstacle=boxVolume('intermediate obstruction',position.clone().addScalar(-.025),position.clone().addScalar(.025));
 assert.deepEqual(checkCollisions(f.rig,{obstacles:[obstacle]}),[],'obstruction is clear of the starting pose');
 const blocked=createBaluPickUp({...f,obstacles:[obstacle]}),source=f.prop.position.clone();
 assert.equal(blocked.validation.reason,'blocked');assert.ok(blocked.validation.at>0);
 for(const t of [4,1,3,0,2]){assert.equal(blocked.update(t).attached,false);assert.ok(f.prop.position.equals(source));}
});
test('contact cannot attach in empty space or through the floor',()=>{
 const f=fixture();let a=createBaluPickUp({...f,gripOffset:V(0,.4,0)});assert.equal(a.update(4).attached,false);assert.ok(a.contactSurfaceError>.025);a.dispose();
 f.prop.position.y=-.1;a=createBaluPickUp(f);assert.equal(a.update(4).attached,false);
});
test('joint curves preserve bounds, C1 knot speeds and resting endpoints',()=>{
 const times=[0,.4,.7,1],curve=createScalarTrack(times,[0,1,.4,0]),h=1e-6;
 for(const t of times.slice(1,-1)){const left=(curve(t)-curve(t-h))/h,right=(curve(t+h)-curve(t))/h;assert.ok(Math.abs(left-right)<.001);}
 assert.ok(Math.abs((curve(h)-curve(0))/h)<.001);assert.ok(Math.abs((curve(1)-curve(1-h))/h)<.001);
 for(let i=0;i<=1000;i++)assert.ok(curve(i/1000)>=0&&curve(i/1000)<=1);
});
test('Balu and rabbit elbows have bounded speed/acceleration, fixed bend sign and deterministic seeking',()=>{
 for(const type of ['balu','rabbit']){
  const f=type==='balu'?fixture():{rig:createCharacterRig('rabbit')};
  const a=type==='balu'?createBaluPickUp(f):createRabbitReachStudy(f);assert.equal(a.validation.reason,undefined);
  let previous,velocity,maxSpeed=0,maxAcceleration=0;
  const snapshot=t=>{a.update(t);return JSON.stringify(Object.values(f.rig.joints).map(j=>j.node.rotation.toArray()));};
  for(let i=0;i<=960;i++){
   a.update(i/240);const angle=f.rig.joints.rightElbow.node.rotation.x;assert.ok(angle<=-Math.PI/36+1e-8);
   if(previous!==undefined){const v=(angle-previous)*240;maxSpeed=Math.max(maxSpeed,Math.abs(v));if(velocity!==undefined)maxAcceleration=Math.max(maxAcceleration,Math.abs(v-velocity)*240);velocity=v;}previous=angle;
  }
  assert.ok(maxSpeed<5,`${type} speed ${maxSpeed}`);assert.ok(maxAcceleration<60,`${type} acceleration ${maxAcceleration}`);
  const expected=snapshot(1.31);snapshot(4);snapshot(.13);assert.equal(snapshot(1.31),expected);
 }
});
