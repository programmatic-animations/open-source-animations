import {capturePose,createPoseTrack} from '../mechanics.js';
import {checkCollisions} from '../../rigs/collision.js';

/** Explicit diagnostic movement, not a recovered legacy rabbit performance. */
export function createRabbitReachStudy({rig,duration=4,obstacles=[]}) {
  if(rig.character!=='rabbit'||!Number.isFinite(duration)||duration<=0)throw new Error('Rabbit rig and positive duration required');
  const times=[0,.15,.42,.62,.85,1];
  const poses=times.map((_,i)=>{
    rig.reset();
    const amount=[0,0,1,1,0,0][i];
    rig.setJoint('rightShoulder',{x:-.45*amount,z:.4+.3*amount});
    rig.setJoint('rightElbow',{x:-Math.PI/36-1.2*amount});
    return capturePose(rig);
  });
  const track=createPoseTrack(rig,times,poses);
  let failure=null;
  for(let i=0;i<=480;i++){
    track(i/480);const hits=checkCollisions(rig,{obstacles});
    if(hits.length){failure={reason:'blocked',at:i/480*duration,hits};break;}
  }
  rig.reset();
  return {duration,validation:failure??{samples:481},reset:()=>rig.reset(),dispose:()=>rig.reset(),update(time){
    if(!Number.isFinite(time))throw new RangeError('time must be finite');
    if(failure){rig.reset();return {phase:'blocked',failure};}
    track(Math.max(0,Math.min(1,time/duration)));
    const hits=checkCollisions(rig,{obstacles});
    if(hits.length){rig.reset();return {phase:'blocked',failure:{hits}};}
    return {phase:'elbow reach study',attached:false,reachError:0};
  }};
}
