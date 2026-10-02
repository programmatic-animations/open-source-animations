import * as THREE from 'three';
import { smoothPhase, capturePose, createPoseTrack } from '../mechanics.js';
import { reachPalm } from '../../rigs/createCharacterRig.js';
import { meshVolumes, checkCollisions, surfaceDistance } from '../../rigs/collision.js';
const V=(x,y,z)=>new THREE.Vector3(x,y,z);

/** Neutral constrained Balu rig only. Prop target and gripOffset use root-local coordinates. */
export function createBaluPickUp({rig,prop,duration=4,effort=0.5,hesitation=0,
  obstacles=[], ground=0, propVolumes=meshVolumes(prop), carry=V(0.63,1.04,0.55),gripOffset=V(0.0828,0.04,-0.24)}) {
  if(rig.character!=='balu') throw new Error('Pickup requires createCharacterRig("balu")');
  if(!Number.isFinite(duration)||duration<=0) throw new RangeError('duration must be positive');
  if(!Number.isFinite(effort)||!Number.isFinite(hesitation)) throw new RangeError('controls must be finite');
  if(!prop.parent) throw new Error('Add prop to scene first');
  effort=THREE.MathUtils.clamp(effort,0,1); hesitation=THREE.MathUtils.clamp(hesitation,0,1);
  const parent=prop.parent,source=prop.position.clone(),rotation=prop.quaternion.clone();
  const gripAt=0.46+hesitation*0.1,liftAt=gripAt+0.07+effort*0.04;
  rig.reset(); rig.root.updateWorldMatrix(true,true);
  let disposed=false, contactReachable=true;
  let seed=capturePose(rig).angles;
  function evaluate(time) {
    if(disposed) throw new Error('Action disposed');
    if(!Number.isFinite(time)) throw new RangeError('time must be finite');
    if(prop.parent!==parent) throw new Error('Prop ownership changed');
    rig.reset(); prop.position.copy(source); prop.quaternion.copy(rotation);
    const p=THREE.MathUtils.clamp(time/duration,0,1);
    const bend=smoothPhase(p,0.06,gripAt-0.04)*(1-smoothPhase(p,liftAt,0.95));
    // A small fixed-length knee bend and torso hinge replace limb/body scaling.
    const knee=0.55*bend,hip=-knee/2;
    rig.pelvis.position.y=rig.contract.pelvis*Math.cos(knee/2);
    for(const side of ['left','right']) {
      rig.setJoint(`${side}Hip`,{x:hip}); rig.setJoint(`${side}Knee`,{x:knee}); rig.setJoint(`${side}Ankle`,{x:hip});
    }
    rig.setJoint('torso',{x:1.08*bend});
    rig.setJoint('head',{x:-0.35*bend});
    rig.setJoint('leftShoulder',{x:-0.3*bend,z:-.25-.15*bend});
    rig.root.updateWorldMatrix(true,true); parent.updateWorldMatrix(true,false);
    const start=rig.root.worldToLocal(parent.localToWorld(source.clone()));
    const rest=rig.root.worldToLocal(rig.hands.right.contact.getWorldPosition(new THREE.Vector3()));
    const target=rest.clone().lerp(start.add(gripOffset),smoothPhase(p,0.12,gripAt));
    target.y+=.20*Math.sin(Math.PI*smoothPhase(p,0.12,gripAt));
    const lift=smoothPhase(p,liftAt,0.94); target.lerp(carry,lift);
    target.y+=Math.sin(Math.PI*lift)*0.025*effort;
    const reached=reachPalm(rig,'right',target,{seed});
    seed=capturePose(rig).angles;
    rig.setJoint('rightGrip',{x:0.8*smoothPhase(p,gripAt-0.04,gripAt+0.02)});
    const attached=contactReachable && p>=gripAt && reached.error<0.025;
    if(attached) prop.position.copy(parent.worldToLocal(rig.root.localToWorld(reached.position.clone().sub(gripOffset))));
    return {phase:p>=gripAt&&!attached?'unreachable':p>=0.94?'hold':p>=liftAt?'lift':p>=gripAt?'grip':p>=0.12?'reach':'anticipate',
      attached,reachError:reached.error,paw:reached.position,progress:p};
  }
  function reset(){rig.reset();prop.position.copy(source);prop.quaternion.copy(rotation);}
  function dispose(){reset();disposed=true;}
  const times=[...new Set([0,.06,.12,.24,.34,gripAt-.04,gripAt,liftAt,.70,.82,.94,1])].sort((a,b)=>a-b);
  const solveTimes=[...new Set([...times,...Array.from({length:121},(_,i)=>i/120)])].sort((a,b)=>a-b);
  const solved=new Map(solveTimes.map(p=>{evaluate(p*duration);return [p,capturePose(rig)];}));
  const poses=times.map(p=>solved.get(p));
  const track=createPoseTrack(rig,times,poses);
  const start=rig.root.worldToLocal(parent.localToWorld(source.clone()));
  track(gripAt);
  const contact=rig.root.worldToLocal(rig.hands.right.contact.getWorldPosition(V()));
  const contactError=contact.distanceTo(start.clone().add(gripOffset));
  prop.position.copy(source);prop.quaternion.copy(rotation);
  const surfaceError=surfaceDistance(prop,rig.root.localToWorld(contact.clone()))/rig.root.getWorldScale(V()).x;
  contactReachable=contactError<.025 && surfaceError<.025;
  // Preserve the measured center-to-palm offset: attachment never snaps the prop.
  parent.updateWorldMatrix(true,true);
  prop.position.copy(source);prop.quaternion.copy(rotation);prop.updateWorldMatrix(true,false);
  const heldTransform=rig.hands.right.wrist.matrixWorld.clone().invert().multiply(prop.matrixWorld);
  const propScale=prop.scale.clone();
  let failure=contactReachable?null:{reason:'unreachable',at:gripAt*duration,contactError,surfaceError};
  function apply(p) {
    track(p);
    rig.pelvis.position.y=rig.contract.pelvis*Math.cos(rig.joints.rightKnee.node.rotation.x/2);
    rig.root.updateWorldMatrix(true,true);
    prop.position.copy(source);prop.quaternion.copy(rotation);
    const paw=rig.root.worldToLocal(rig.hands.right.contact.getWorldPosition(V()));
    if(p>=gripAt&&contactReachable){
      const matrix=parent.matrixWorld.clone().invert().multiply(rig.hands.right.wrist.matrixWorld).multiply(heldTransform);
      matrix.decompose(prop.position,prop.quaternion,new THREE.Vector3());prop.scale.copy(propScale);
    }
    return paw;
  }
  // Dense subframe preflight is independent of playback/seeking order.
  // This is sampled validation, not a continuous collision proof.
  if(!failure)for(let i=0;i<=480;i++){
    const p=i/480;apply(p);
    const hits=checkCollisions(rig,{propVolumes,obstacles,ground});
    if(hits.length){failure={reason:'blocked',at:p*duration,hits};break;}
  }
  function update(time) {
    if(disposed)throw new Error('Action disposed');
    if(!Number.isFinite(time))throw new RangeError('time must be finite');
    if(prop.parent!==parent)throw new Error('Prop ownership changed');
    const p=THREE.MathUtils.clamp(time/duration,0,1);
    if(failure){reset();return {phase:failure.reason,attached:false,reachError:contactError,paw:rig.root.worldToLocal(rig.hands.right.contact.getWorldPosition(V())),progress:p,failure};}
    const paw=apply(p),hits=checkCollisions(rig,{propVolumes,obstacles,ground});
    if(hits.length){reset();return {phase:'blocked',attached:false,reachError:contactError,paw:rig.root.worldToLocal(rig.hands.right.contact.getWorldPosition(V())),progress:p,failure:{reason:'blocked',at:time,hits}};}
    return {phase:p>=.94?'hold':p>=liftAt?'lift':p>=gripAt?'grip':p>=.12?'reach':'anticipate',attached:p>=gripAt,reachError:contactError,paw,progress:p};
  }
  reset();
  return {update,reset,dispose,duration,contactSurfaceError:surfaceError,validation:failure??{samples:481},contactTime:gripAt*duration};
}
