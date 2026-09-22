import { defineShots } from '../../runtime/shotTimeline.js';

export const SHOTS = defineShots([
  { id:'stroll', title:'A perfectly good day', duration:1.4 },
  { id:'hi', title:'Monkey · Hi', duration:1.3 },
  { id:'reply', title:'Balu · Good, how are you?', duration:2.2 },
  { id:'monkey', title:'The eyebrow · …Good', duration:1.65 },
  { id:'realization', title:'Instantly aged · turn away', duration:1.75 },
  { id:'walk', title:'Brisk escape · cemetery reveal', duration:2.2 },
  { id:'dig', title:'Already digging · heave and toss', duration:2.6 },
  { id:'flower', title:'One flower · pluck insert', duration:.95 },
  { id:'overhead', title:'Already buried in embarrassment', duration:6.8 }
].map(shot => ({ ...shot, verticalZoom:(16/9)/(9/16) })));
export const DURATION = SHOTS.at(-1).end;
export const cue = id => SHOTS.find(s=>s.id===id);

// Position and tangent share one continuous path through realization and escape.
export const TURN_START = cue('realization').start + .9;
export function travelPose(time) {
  const speed=.62, x0=-1.8+TURN_START*speed;
  if(time<=TURN_START) return {x:-1.8+time*speed,z:3,yaw:Math.PI/2};
  const duration=cue('walk').end-TURN_START;
  const p=Math.min(1,(time-TURN_START)/duration),q=1-p;
  // Approach the opening before turning inward; leave room for shoulders and swinging paws.
  const a={x:x0,z:3},b={x:x0+speed*duration/3,z:3},c={x:8.9,z:4},d={x:8,z:.65};
  const x=q*q*q*a.x+3*q*q*p*b.x+3*q*p*p*c.x+p*p*p*d.x;
  const z=q*q*q*a.z+3*q*q*p*b.z+3*q*p*p*c.z+p*p*p*d.z;
  const dx=3*q*q*(b.x-a.x)+6*q*p*(c.x-b.x)+3*p*p*(d.x-c.x);
  const dz=3*q*q*(b.z-a.z)+6*q*p*(c.z-b.z)+3*p*p*(d.z-c.z);
  return {x,z,yaw:Math.atan2(dx,dz)};
}
