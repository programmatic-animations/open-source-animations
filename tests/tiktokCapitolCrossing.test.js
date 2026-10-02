import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCapitolCrossingScene,SCENE_CONFIG} from '../src/tiktok/capitolCrossing/scene.js';
import {SHOTS,DURATION,cue,IMPACT,LANDING} from '../src/tiktok/capitolCrossing/shots.js';
import {applyVideoFraming,resolveVideoFormat} from '../src/runtime/videoFormat.js';
import {getShotAt} from '../src/runtime/shotTimeline.js';
import {resolveContentSelection} from '../src/runtime/contentSelection.js';
const setup=()=>{const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(48,9/16,.1,200);return {scene,camera,...createCapitolCrossingScene({scene,camera})};};
function snapshot(r,t){r.update(t);applyVideoFraming(r.camera,resolveVideoFormat('vertical'),getShotAt(SHOTS,t).shot);const a=[];r.scene.traverse(n=>a.push(n.visible,...n.matrixWorld.elements));return [...a,...r.camera.matrixWorld.elements,...r.camera.projectionMatrix.elements];}
test('Capitol TikTok registers separately, with one uninterrupted crossing shot',()=>{
  const s=resolveContentSelection(new URLSearchParams('collection=tiktok&video=tiktok-capitol-crossing'));
  assert.equal(s.scene.id,SCENE_CONFIG.id);assert.equal(DURATION,21);assert.equal(getShotAt(SHOTS,IMPACT).shot.id,'crossing');assert.equal(getShotAt(SHOTS,LANDING+2).shot.id,'crossing');
});
test('every pose is finite and backward seeking restores props, expression and cameras',()=>{
  const r=setup();for(let t=0;t<=DURATION;t+=.2)assert.ok(snapshot(r,t).every(x=>typeof x==='boolean'||Number.isFinite(x)));
  for(const t of [0,3.7,5.4,6.9,7.4,10,11.8,13.2,IMPACT-.01,IMPACT+.5,LANDING+.1,21]){
    const expected=snapshot(r,t);snapshot(r,5.5);snapshot(r,21);snapshot(r,0);assert.deepEqual(snapshot(r,t),expected,`reversible at ${t}`);
  }
});
test('traffic flows in opposite lanes and clears before both deliberate street checks',()=>{
  const r=setup();r.update(1);const xs=r.props.passes.map(p=>p.car.position.x);r.update(1.1);
  r.props.passes.forEach((p,i)=>assert.equal(Math.sign(p.car.position.x-xs[i]),p.lane?-1:1));
  for(let t=cue('left').start;t<cue('crossing').start;t+=.1){r.update(t);assert.ok(r.props.passes.every(p=>Math.abs(p.car.position.x)>20));assert.equal(r.props.impactCar.car.visible,false);}
});
test('car makes contact, bear flies clear, and final face and full body stay inside portrait',()=>{
  const r=setup();r.update(IMPACT);
  const carBox=new THREE.Box3().setFromObject(r.props.impactCar.car),bodyBox=new THREE.Box3().setFromObject(r.actors.body);
  assert.ok(carBox.intersectsBox(bodyBox),'physical contact at launch');
  r.update(IMPACT+.5);assert.ok(r.actors.bear.position.y>3);
  for(let t=cue('crossing').start;t<=DURATION;t+=1/30){
    snapshot(r,t);r.actors.bear.traverse(n=>{
      if(!n.isMesh||!n.visible)return;
      const vertices=n.geometry.attributes.position;
      for(let i=0;i<vertices.count;i++){
        const p=new THREE.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(n.matrixWorld).project(r.camera);
        assert.ok(Math.abs(p.x)<.96&&Math.abs(p.y)<.92,`bear clips frame at ${t}: ${p.x},${p.y}`);
      }
    });
  }
  r.update(DURATION);assert.ok(r.actors.crosses.visible&&r.actors.mouth.visible);assert.ok(r.actors.eyes.every(e=>!e.visible));
  assert.ok(r.actors.bear.position.x-(r.props.impactCar.car.position.x+1.8)>2);
  const faceNormal=new THREE.Vector3(0,0,1).applyQuaternion(r.actors.bear.quaternion);assert.ok(faceNormal.y>.99);
  r.update(0);assert.equal(r.actors.crosses.visible,false);assert.equal(r.actors.mouth.visible,false);
});

test('V2 keeps tie and phone attached, adds a second step, and eases into a face-readable overhead',()=>{
  const r=setup();
  for(let t=0;t<=DURATION;t+=.1){
    r.update(t);assert.equal(r.props.phone.visible,true);assert.equal(r.props.phone.parent,r.actors.rightArm);
    assert.equal(r.props.watch.parent,r.actors.leftArm);assert.equal(r.props.tie.parent,r.actors.bear);
  }
  r.update(cue('false-gap').start+.48);const firstZ=r.actors.bear.position.z,firstFoot=r.actors.rightLeg.position.z;
  r.update(cue('false-gap').start+.9);assert.ok(r.actors.bear.position.z<firstZ-.12);assert.ok(r.actors.rightLeg.position.z>firstFoot+.2);
  r.update(LANDING);const before=r.camera.getWorldDirection(new THREE.Vector3()).y;
  let prior=r.camera.position.clone();
  for(let t=LANDING+.01;t<=DURATION;t+=.01){r.update(t);assert.ok(r.camera.position.distanceTo(prior)<.085,'camera transition stays smooth');prior.copy(r.camera.position);}
  r.update(DURATION);const after=r.camera.getWorldDirection(new THREE.Vector3()).y;
  assert.ok(after<-.99&&after<before-.2,'finish almost overhead');
  const phoneBox=new THREE.Box3().setFromObject(r.props.phone);assert.ok(phoneBox.min.y>-.02,'phone clears the road');
});

test('V3 gaze follows the phone, first attempt adds a third step, and final camera never holds',()=>{
  const r=setup();r.update(0);const homes=r.actors.eyes.map(e=>e.position.clone());
  r.update(cue('phone').start+.7);
  const screen=r.actors.headGroup.worldToLocal(r.props.phone.localToWorld(new THREE.Vector3(0,.01,.04)));
  r.actors.eyes.forEach((e,i)=>{
    const movement=e.position.clone().sub(homes[i]),target=screen.clone().sub(homes[i]);
    assert.ok(movement.y<-.035,'eyes visibly lower toward screen');
    assert.ok(movement.dot(target)>0,'gaze shifts toward actual phone');
  });
  r.update(0);r.actors.eyes.forEach((e,i)=>assert.deepEqual(e.position,homes[i]));
  r.update(cue('false-gap').start+.9);const z=r.actors.bear.position.z,left=r.actors.leftLeg.position.z;
  r.update(cue('false-gap').start+1.4);assert.ok(r.actors.bear.position.z<z-.15);assert.ok(r.actors.leftLeg.position.z>left+.15);
  r.update(cue('crossing').start);let prior=r.camera.position.clone();
  for(let t=cue('crossing').start+1/60;t<=DURATION;t+=1/60){
    r.update(t);const delta=r.camera.position.distanceTo(prior);assert.ok(delta>.0001&&delta<.14,'camera remains moving smoothly');prior.copy(r.camera.position);
  }
  assert.equal(IMPACT,16.05);assert.ok(Math.abs(LANDING-17.1)<1e-9);
});
