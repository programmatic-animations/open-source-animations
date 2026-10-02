import * as THREE from 'three';
import { reachPalm, reachMarker } from '../../rigs/createCharacterRig.js';
import { capturePose, createPoseTrack, smoothPhase } from '../mechanics.js';
import { checkCollisions, meshVolumes, surfaceDistance } from '../../rigs/collision.js';

/** Balu raises a holstered pad with the existing left paw and writes with his
 * persistent right-paw pencil. Owns arm joints; neutral body/feet remain planted.
 * A measured palm-to-pad transform establishes contact before rigid attachment.
 * Pen tip is a fixed marker; bounded FK is baked into absolute-time curves.
 * Entry neutral; exit holds the crossed-out pad. Used by Be You.
 */
export function createBaluNotebookAction({rig,notebook,powerHands,duration=5}) {
  const {book,points,penTip,pen}=notebook;
  if(rig.character!=='balu'||book.parent!==rig.root)throw new Error('Notebook requires root-local Balu prop');
  const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
  const contactTime=.35,liftEnd=1.55,strokeStart=2.05,strokeEnd=2.72;
  const wristMatrix=()=>{rig.root.updateWorldMatrix(true,true);return rig.root.matrixWorld.clone().invert().multiply(rig.hands.left.wrist.matrixWorld);};
  // Pad is outside the palm's front surface. Its plane follows the same rigid
  // wrist orientation, so the palm can hold it without passing through a page.
  const attachment=new THREE.Matrix4().makeTranslation(0,-.08,.45);
  const gripContact=notebook.configureGrip(V(0,0,-.305));
  rig.reset();rig.setJoint('leftShoulder',{x:-.25,z:-.45});rig.setJoint('leftElbow',{x:-.6});
  const contactSeed=capturePose(rig).angles;
  const sourceMatrix=wristMatrix().multiply(attachment);
  const source=V(),sourceQ=new THREE.Quaternion();sourceMatrix.decompose(source,sourceQ,V());
  const contactTarget=rig.root.worldToLocal(rig.hands.left.contact.getWorldPosition(V()));
  rig.reset();powerHands.update(0);rig.root.updateWorldMatrix(true,true);
  const restSeed=capturePose(rig).angles;
  const carry=V(-.35,.9,.7);reachPalm(rig,'left',carry);
  const carrySeed=capturePose(rig).angles;
  const samples=[0,.12,.22,.35,.5,.7,.95,1.2,1.55,1.8,1.95,2.05,2.2,2.4,2.6,2.72,2.9,3.2,3.6,duration];
  const poses=[];let seed=restSeed;let failure=null;
  function attachBook(t){
    if(t<contactTime){book.position.copy(source);book.quaternion.copy(sourceQ);}
    else wristMatrix().multiply(attachment).decompose(book.position,book.quaternion,V());
    book.scale.set(1,1,1);
    book.updateWorldMatrix(true,true);
  }
  function linePoint(progress){
    const p=THREE.MathUtils.clamp(progress,0,1),scaled=p*64,i=Math.min(63,Math.floor(scaled));
    return points[i].clone().lerp(points[i+1],scaled-i);
  }
  for(const t of samples){
    rig.reset();powerHands.update(0);
    const lift=smoothPhase(t,contactTime+.03,liftEnd);
    if(t<=contactTime){
      const from=restSeed,to=contactSeed,p=smoothPhase(t,0,contactTime);
      for(const name of ['leftShoulder','leftElbow','leftWrist'])rig.setJoint(name,Object.fromEntries(['x','y','z'].map(axis=>[axis,
        from[name][axis]+(to[name][axis]-from[name][axis])*p])));
    }else{
      const leftSeed={};
      for(const name of ['leftShoulder','leftElbow','leftWrist'])leftSeed[name]=Object.fromEntries(['x','y','z'].map(axis=>[axis,
        contactSeed[name][axis]+(carrySeed[name][axis]-contactSeed[name][axis])*lift]));
      const target=contactTarget.clone().lerp(carry,lift);target.y+=.035*Math.sin(Math.PI*lift);
      const reached=reachPalm(rig,'left',target,{seed:leftSeed});
      if(reached.error>.025)failure??={reason:'unreachable',at:t,error:reached.error};
    }
    attachBook(t);
    if(t>.7){
      const progress=smoothPhase(t,strokeStart,strokeEnd);
      const point=linePoint(progress).applyMatrix4(book.matrix);
      const normal=V(0,0,1).applyQuaternion(book.quaternion);
      const hover=.09*(1-smoothPhase(t,1.8,strokeStart))+.1*smoothPhase(t,strokeEnd,3.2);
      point.addScaledVector(normal,hover);
      rig.root.updateWorldMatrix(true,true);
      const rest=rig.root.worldToLocal(penTip.getWorldPosition(V()));
      const target=rest.lerp(point,smoothPhase(t,.7,1.6));
      const reached=reachMarker(rig,'right',penTip,target,{seed});
      if(reached.error>.025&&t>=strokeStart&&t<=strokeEnd)failure??={reason:'unreachable-write',at:t,error:reached.error};
    }
    rig.setJoint('leftGrip',{x:.85*smoothPhase(t,0,.12)});rig.setJoint('rightGrip',{x:0});
    seed=capturePose(rig).angles;poses.push(capturePose(rig));
  }
  const track=createPoseTrack(rig,samples,poses);
  const propVolumes=[...meshVolumes(notebook.cover,'notebook'),...meshVolumes(notebook.grip,'notebook'),...meshVolumes(pen,'pencil')];
  function apply(t){track(t);powerHands.update(0);attachBook(t);const p=smoothPhase(t,strokeStart,strokeEnd);notebook.update(p);return p;}
  if(!failure)for(let i=0;i<=240;i++){
    const t=duration*i/240;apply(t);const hits=checkCollisions(rig,{propVolumes});
    if(hits.length){failure={reason:'blocked',at:t,hits};break;}
  }
  apply(contactTime);
  const contactError=surfaceDistance(gripContact,rig.hands.left.contact.getWorldPosition(V()));
  if(contactError>.025)failure??={reason:'unreachable-grip',contactError};
  function update(time){
    const t=THREE.MathUtils.clamp(time,0,duration);
    if(failure){rig.reset();book.position.copy(source);book.quaternion.copy(sourceQ);notebook.update(0);return{failure,attached:false,progress:0};}
    const progress=apply(t),tip=rig.root.worldToLocal(penTip.getWorldPosition(V()));
    const target=linePoint(progress).applyMatrix4(book.matrix);
    return {attached:t>=contactTime,progress,writing:t>=strokeStart&&t<=strokeEnd,
      tipError:tip.distanceTo(target),contactError,phase:t<contactTime?'reach':t<liftEnd?'lift':t<strokeStart?'prepare':t<=strokeEnd?'cross-out':'hold'};
  }
  rig.reset();powerHands.update(0);book.position.copy(source);book.quaternion.copy(sourceQ);notebook.update(0);
  return {update,validation:failure??{samples:241},source,sourceQ,contactTime,strokeStart,strokeEnd};
}
