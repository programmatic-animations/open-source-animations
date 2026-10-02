import * as THREE from 'three';
import { createBear } from '../bear.js';
import { createRabbit } from '../rabbit.js';
import { meshVolumes } from './collision.js';
import { CHARACTER_RIGS, connectedCollisionPairs } from './contracts.js';

/** Opt-in rigs; legacy character factories and their consumers remain unchanged. */
export function createCharacterRig(character = 'balu') {
  const contract = CHARACTER_RIGS[character];
  if (!contract) throw new Error(`Unknown rig: ${character}`);
  const visual = character === 'balu' ? createBear({position:{x:0,y:0,z:0}}) : createRabbit();
  const root = visual.bear ?? visual.rabbit;
  const material = visual.body.material;
  const joints = {};
  function joint(name, parent, position, type) {
    const node = new THREE.Group(); node.name = name; node.position.fromArray(position); parent.add(node);
    joints[name] = { node, limits: contract.limits[type], rest: node.position.clone() }; return node;
  }
  function mesh(geometry, parent, position = [0,0,0], scale = [1,1,1]) {
    const node = new THREE.Mesh(geometry, material);
    node.position.fromArray(position); node.scale.fromArray(scale); parent.add(node); return node;
  }
  function bone(parent, length, radius, endClearance=0) {
    mesh(new THREE.CylinderGeometry(radius, radius * 1.08, length-endClearance, 12), parent, [0,-(length-endClearance)/2,0]);
    mesh(new THREE.SphereGeometry(radius,12,8), parent);
  }
  const pelvis = new THREE.Group(); pelvis.position.y = contract.pelvis; root.add(pelvis);
  const torso = joint('torso',pelvis,[0,0,0],'torso');
  torso.add(visual.body); visual.body.position.set(0,contract.torsoCenter,0);
  visual.body.scale.fromArray(contract.bodyScale);
  const neck = joint('head',torso,[0,contract.head,0],'head'); neck.add(visual.headGroup); visual.headGroup.position.set(0,0,0);
  if(character === 'rabbit') {
    // Ear pivots sit at their bases; inner ears follow the same rigid outer ear.
    for(const side of ['left','right']) {
      const ear = visual[`${side}Ear`]; const x = side === 'left' ? -0.2 : 0.2;
      const pivot = joint(`${side}Ear`,visual.headGroup,[x,0.25,0],'ear');
      const inner = visual.headGroup.children.find(o => o.isMesh && Math.abs(o.position.x-x)<0.001 && o.position.z===0.12);
      pivot.add(ear); ear.position.set(0,0.33,0);
      if(inner) { pivot.add(inner); inner.position.set(0,0.34,0.12); }
    }
    const jaw = joint('jaw',visual.headGroup,[0,-0.24,0.39],'jaw'); jaw.add(visual.jaw); visual.jaw.position.set(0,0,0);
    // New rabbit anatomy has short legs; raise/shrink the belly to keep its neutral floor clearance.

  }
  const hands = {}, feet = {};
  for(const [side,sign] of [['left',-1],['right',1]]) {
    visual[`${side}Arm`]?.removeFromParent(); visual[`${side}Leg`]?.removeFromParent();
    const shoulder = joint(`${side}Shoulder`,torso,[sign*contract.shoulder[0],contract.shoulder[1],0],'shoulder');
    bone(shoulder,contract.upperArm,contract.paw[0]*0.85);
    const elbow = joint(`${side}Elbow`,shoulder,[0,-contract.upperArm,0],'elbow'); bone(elbow,contract.forearm,contract.paw[0]*0.8);
    const wrist = joint(`${side}Wrist`,elbow,[0,-contract.forearm,0],'wrist');
    mesh(new THREE.SphereGeometry(1,16,12),wrist,[0,-0.06,0],contract.paw);
    // A small rounded thumb closes against the palm, without long human fingers.
    const thumb = joint(`${side}Grip`,wrist,[sign*-contract.paw[0]*0.65,-0.03,0.07],'grip');
    mesh(new THREE.SphereGeometry(1,12,8),thumb,[0,-0.04,0],[contract.paw[0]*0.48,contract.paw[1]*0.55,contract.paw[2]*0.55]);
    const contact = new THREE.Group(); contact.name = `${side}PalmContact`; contact.position.set(0,-0.08,contract.paw[2]); wrist.add(contact);
    hands[side] = { shoulder, elbow, wrist, contact };
    const hip=joint(`${side}Hip`,pelvis,[sign*contract.hipWidth,0,0],'hip'); bone(hip,contract.thigh,contract.paw[0]);
    const knee=joint(`${side}Knee`,hip,[0,-contract.thigh,0],'knee'); bone(knee,contract.shin,contract.paw[0],contract.shinClearance);
    const ankle=joint(`${side}Ankle`,knee,[0,-contract.shin,0],'ankle');
    mesh(new THREE.SphereGeometry(1,16,10),ankle,[0,0.065,0.065],[contract.paw[0]*1.12,0.065,contract.paw[0]*1.5]);
    feet[side]=ankle;
  }
  function setJoint(name, angles={}) {
    const j=joints[name]; if(!j) throw new Error(`Unknown joint ${name}`);
    for(const axis of ['x','y','z']) {
      const value=angles[axis]??0; if(!Number.isFinite(value)) throw new RangeError('Joint angles must be finite');
      j.node.rotation[axis]=THREE.MathUtils.clamp(value,...j.limits[axis]);
    }
  }
  function reset() {
    pelvis.position.set(0,contract.pelvis,0);
    for(const [name,j] of Object.entries(joints)) { j.node.position.copy(j.rest); j.node.scale.set(1,1,1); setJoint(name); }
    for(const [side,sign] of [['left',-1],['right',1]])setJoint(`${side}Shoulder`,{z:sign*contract.restShoulder});
  }
  function dispose() { root.removeFromParent(); root.traverse(o=>{if(o.isMesh){o.geometry.dispose();}}); const materials=new Set(); root.traverse(o=>{if(o.isMesh)materials.add(o.material);}); materials.forEach(m=>m.dispose()); }
  const volumes=[];
  root.traverse(node=>{
    if(!node.isMesh)return;
    let parent=node.parent;
    while(parent && !joints[parent.name])parent=parent.parent;
    const part=parent?.name ?? 'torso';
    volumes.push(...meshVolumes(node,part));
  });
  const exceptions=new Set(connectedCollisionPairs().map(pair=>pair.sort().join('|')));
  const collision={volumes,exceptions};
  reset();
  return { collision, character, contract, root, visual, pelvis, torso, joints, hands, feet, setJoint, reset, dispose };
}

/** Deterministic coordinate descent over constrained FK joints, targeting a palm marker. */
export function reachPalm(rig, side, target, {seed} = {}) {
  return reachMarker(rig,side,rig.hands[side].contact,target,{seed});
}

/** Same bounded FK solve, targeting a declared fixed marker (e.g. a claw tip). */
export function reachMarker(rig, side, marker, target, {seed} = {}) {
  const root=rig.root;
  const axes=[[`${side}Shoulder`,'x'],[`${side}Shoulder`,'y'],[`${side}Shoulder`,'z'],[`${side}Elbow`,'x'],[`${side}Wrist`,'x']];
  const point=new THREE.Vector3();
  function error() { root.updateWorldMatrix(true,true); root.worldToLocal(marker.getWorldPosition(point)); return point.distanceToSquared(target); }
  // Always begin with the same seed, so arbitrary seeking returns identical poses.
  for(const name of [`${side}Shoulder`,`${side}Elbow`,`${side}Wrist`]) rig.setJoint(name);
  rig.setJoint(`${side}Elbow`,{x:-1.0});
  rig.setJoint(`${side}Shoulder`,{x:-0.4});
  if(seed)for(const name of [`${side}Shoulder`,`${side}Elbow`,`${side}Wrist`])rig.setJoint(name,seed[name]);
  for(const step of [0.65,0.3,0.12,0.05,0.02,0.008,0.003,0.001,0.0003]) {
    for(let iteration=0;iteration<40;iteration++) {
      let improved=false;
      for(const [name,axis] of axes) {
        const j=rig.joints[name], initial=j.node.rotation[axis]; let best=initial,bestError=error();
        for(const direction of [-1,1]) {
          j.node.rotation[axis]=THREE.MathUtils.clamp(initial+direction*step,...j.limits[axis]);
          const e=error(); if(e<bestError){bestError=e;best=j.node.rotation[axis];}
        }
        j.node.rotation[axis]=best; improved ||= best!==initial;
      }
      if(!improved) break;
    }
  }
  return { error:Math.sqrt(error()), position:point.clone() };
}
