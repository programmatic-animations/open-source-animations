import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createAwkwardHelloScene,SCENE_CONFIG} from '../src/tiktok/awkwardHello/scene.js';
import {SHOTS,DURATION,cue,TURN_START,travelPose} from '../src/tiktok/awkwardHello/shots.js';
import {applyVideoFraming,resolveVideoFormat} from '../src/runtime/videoFormat.js';
import {getShotAt} from '../src/runtime/shotTimeline.js';
import {resolveContentSelection} from '../src/runtime/contentSelection.js';
const setup=()=>{const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,9/16,.1,100);return {scene,camera,...createAwkwardHelloScene({scene,camera})};};

test('new TikTok registers independently and both actors keep moving through every dialogue beat',()=>{
  const selected=resolveContentSelection(new URLSearchParams('collection=tiktok&video=tiktok-awkward-hello'));
  assert.equal(selected.scene.id,SCENE_CONFIG.id);
  assert.equal(SHOTS.at(-1).end,DURATION);
  const {update,actors}=setup();
  for(let t=cue('hi').start;t<cue('monkey').end-.05;t+=.1){
    update(t);const bx=actors.bear.position.x,mx=actors.monkey.monkey.position.x;
    assert.ok(actors.monkey.monkey.position.z-actors.bear.position.z>1,'passing lanes do not collide');
    update(t+.05);
    assert.ok(actors.bear.position.x>bx,'bear never stops');
    assert.ok(actors.monkey.monkey.position.x<mx,'monkey never stops');
  }
});

test('all shots are finite, reversible and restore the camera up vector after overhead',()=>{
  const r=setup();
  const snapshot=t=>{r.update(t);applyVideoFraming(r.camera,resolveVideoFormat('vertical'),getShotAt(SHOTS,t).shot);const data=[];r.scene.traverse(n=>data.push(n.visible,...n.matrixWorld.elements));data.push(...r.camera.matrixWorld.elements,...r.camera.up.toArray());return data;};
  for(let t=0;t<=DURATION;t+=.25){snapshot(t);r.scene.traverse(n=>assert.ok(n.matrixWorld.elements.every(Number.isFinite)));}
  for(const s of SHOTS){const t=s.start+s.duration*.57,expected=snapshot(t);snapshot(DURATION);snapshot(0);assert.deepEqual(snapshot(t),expected,s.id);}
  snapshot(0);assert.deepEqual(r.camera.up.toArray(),[0,1,0]);
});

test('both paws maintain physical shovel contact throughout the digging montage',()=>{
  const r=setup();
  for(const s of SHOTS.filter(s=>s.id==='dig')){
    for(let t=s.start;t<s.end;t+=1/30){
      r.update(t);
      [r.actors.leftArm,r.actors.rightArm].forEach((arm,i)=>{
        assert.ok(arm.scale.y<1.25,'grip must not stretch the arm excessively');
        const paw=arm.localToWorld(new THREE.Vector3(0,-.7,0));
        assert.ok(paw.distanceTo(r.handTargets[i])<.015,`shovel detached at ${t}`);
      });
    }
  }
});

test('final pose lies inside an open grave, holds the flower over the chest, and camera pulls out vertically',()=>{
  const r=setup();r.update(SHOTS.at(-1).start);const firstHeight=r.camera.position.y;
  r.update(DURATION);assert.ok(r.camera.position.y>firstHeight+6);
  assert.equal(r.props.cover.visible,false);
  const flower=r.actors.bear.worldToLocal(r.props.flower.position.clone());
  assert.ok(Math.abs(flower.x)<.01&&flower.y>.5&&flower.y<.8&&flower.z>.45);
  const head=r.actors.headGroup.getWorldPosition(new THREE.Vector3());
  assert.ok(head.x>9&&head.x<11&&head.z>-1.8&&head.z<1.8&&head.y<0);
  const direction=r.camera.getWorldDirection(new THREE.Vector3());assert.ok(direction.y<-.999);
  r.update(0);assert.equal(r.props.cover.visible,true);assert.ok(r.props.piles.every(p=>!p.visible));
});


test('stress reads after realization and disappears when seeking before it',()=>{
 const r=setup();r.update(cue('realization').end);
 assert.ok(r.actors.bags.every(b=>b.visible&&b.scale.y===1));
 assert.ok(r.actors.eyes.every(e=>e.scale.y<.7));
 r.update(cue('reply').start);assert.ok(r.actors.bags.every(b=>!b.visible));
});
test('turn is continuous, faces its travel direction, and accelerates into escape',()=>{
 const before=travelPose(TURN_START-.001),after=travelPose(TURN_START+.001);
 assert.ok(Math.hypot(after.x-before.x,after.z-before.z)<.003);
 assert.ok(Math.abs(after.yaw-before.yaw)<.01);
 for(let t=TURN_START;t<cue('walk').end-.01;t+=.01){
  const a=travelPose(t),b=travelPose(t+.001);
  const speed=Math.hypot(b.x-a.x,b.z-a.z)/.001;
  assert.ok(speed>.6);
  assert.ok(Math.abs(Math.atan2(b.x-a.x,b.z-a.z)-a.yaw)<.01);
 }
 const r=setup();r.update(cue('dig').start);assert.ok(r.actors.bear.position.y<-.7);
 assert.equal(r.props.cover.visible,false);
 assert.deepEqual(SHOTS.slice(-2).map(s=>s.id),['flower','overhead']);
});


test('cemetery approach clears both solid gateway posts with the entire animated bear',()=>{
 const r=setup();
 const posts=[6.15,10.05].map(x=>new THREE.Box3(new THREE.Vector3(x-.14,0,1.625),new THREE.Vector3(x+.14,2.5,1.975)));
 for(let t=TURN_START;t<=cue('walk').end;t+=1/120){
  r.update(t);
  r.actors.bear.traverse(n=>{
   if(!n.isMesh||!n.visible)return;
   const box=new THREE.Box3().setFromObject(n);
   for(const post of posts)assert.ok(!box.intersectsBox(post),`bear intersects gateway at ${t}`);
  });
 }
});
