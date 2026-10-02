import { defineShots } from '../../runtime/shotTimeline.js';

export const SHOTS = defineShots([
  { id:'waiting', title:'Capitol Avenue · no opening', duration:3 },
  { id:'watch', title:'Somewhere to be', duration:1.7 },
  { id:'phone', title:'Still waiting', duration:1.8 },
  { id:'false-gap', title:'One foot · absolutely not', duration:3 },
  { id:'angry', title:'Seriously?', duration:1.5 },
  { id:'left', title:'Left · clear', duration:1.4 },
  { id:'right', title:'Right · clear', duration:1.4 },
  { id:'crossing', title:'The coast is clear', duration:7.2 }
].map(s=>({...s,verticalZoom:(16/9)/(9/16)})));
export const DURATION = SHOTS.at(-1).end;
export const cue = id => SHOTS.find(s=>s.id===id);
export const IMPACT = cue('crossing').start + 2.25;
export const LANDING = IMPACT + 1.05;
