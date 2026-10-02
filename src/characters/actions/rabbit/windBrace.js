import { smoothPhase } from '../mechanics.js';

/** Constrained, planted rabbit reaction. Arms stay outside the torso.
 * Owns torso/head/ears/arms while active; scene owns root, gaze and facial detail.
 * Entry: neutral rig; exit: balanced pose. No root translation or limb scaling.
 * Absolute-time anticipation, brace, forward overshoot and delayed ear settle.
 * Used by Be You. Dense collision/ground samples are in beYou.test.js.
 */
export function createRabbitWindBrace(rig,{start=14.9,stop=23,delay=0}={}) {
  if(rig.character!=='rabbit')throw new Error('Wind brace requires rabbit anatomy');
  return function update(time) {
    const onset=smoothPhase(time,start+delay,start+.35+delay);
    const calm=smoothPhase(time,stop+.25,stop+1.75);
    const force=onset*(1-smoothPhase(time,stop,stop+.1));
    const brace=onset*(1-calm);
    const stumble=smoothPhase(time,stop+.06,stop+.35)*(1-smoothPhase(time,stop+.55,stop+1.15));
    const pulse=force*Math.sin((time-start)*22+delay*12)*.025;
    rig.setJoint('torso',{z:.27*brace*(1-.6*stumble)+.06*stumble+pulse*.55,x:.05*brace+.22*stumble});
    rig.setJoint('head',{y:-.35,x:-.08*brace-.13*stumble,z:-.09*brace+pulse});
    for(const side of ['left','right']){
      const sign=side==='left'?-1:1;
      rig.setJoint(`${side}Shoulder`,{x:-.52*brace-.25*stumble,z:sign*(.4+.24*brace+.18*stumble)});
      rig.setJoint(`${side}Elbow`,{x:-.55*brace-.35*stumble-.09});
      rig.setJoint(`${side}Ear`,{z:-.42*brace + sign*.015*Math.sin(time*20)*force,x:.78*brace+.07*stumble});
    }
    return {force,brace,stumble,settled:time>=stop+1.75};
  };
}
