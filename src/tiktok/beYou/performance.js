import { capturePose, createPoseTrack, smoothPhase } from '../../characters/actions/mechanics.js';

function pose(rig, overrides) {
  rig.reset();for(const [joint,angles]of Object.entries(overrides))rig.setJoint(joint,angles);
  return capturePose(rig);
}

// Scene-specific dialogue accents, not a phoneme-by-phoneme speech loop.
export function createBaluPerformance(rig) {
  const keys=[
    [0,{head:{y:.18,z:-.045},rightShoulder:{x:-.22,z:.42},rightElbow:{x:-.5}}],
    [.5,{torso:{x:-.035},head:{y:.22,z:-.08},rightShoulder:{x:-.45,z:.55},rightElbow:{x:-.8}}],
    [1.65,{head:{y:.18,z:.025},rightShoulder:{x:-.55,z:.68},rightElbow:{x:-.75}}],
    [2.9,{head:{y:.25,z:-.02},rightShoulder:{x:-.3,z:.43},rightElbow:{x:-.6}}],
    [3.55,{head:{y:.3}}],
    [7.9,{head:{y:.30,x:-.035}}],
    [8.45,{head:{y:.18,z:-.16},rightShoulder:{x:-.65,z:.58},rightElbow:{x:-1.05}}],
    [9.35,{head:{y:.28,z:-.08},rightShoulder:{x:-.38,z:.40},rightElbow:{x:-.7}}],
    [10.15,{head:{y:.25,z:-.015}}],
    [11.5,{head:{y:.1,x:-.05}}],
    [11.95,{head:{x:.11,y:.08}}],
    [12.3,{head:{x:-.035,y:.06}}],
    [12.6,{torso:{x:.07},head:{x:-.06},rightShoulder:{x:-.1,z:.36},rightElbow:{x:-.4}}],
    [12.70,{torso:{x:.065},head:{x:-.06},leftShoulder:{x:.25,z:-.75},leftElbow:{x:-2.25},rightShoulder:{x:-.12,z:.38},rightElbow:{x:-.42}}],
    [12.8,{torso:{x:.06},head:{x:-.06},leftShoulder:{x:-.4,z:-.85},leftElbow:{x:-2.25},rightShoulder:{x:-.15,z:.4},rightElbow:{x:-.45}}],
    [13.25,{torso:{x:.045},head:{x:-.05},leftShoulder:{x:-.4,z:-.85},rightShoulder:{x:-.4,z:.65},leftElbow:{x:-2.25},rightElbow:{x:-.8},leftGrip:{x:.7},rightGrip:{x:.7}}],
    [14.55,{torso:{x:-.06},head:{x:-.05},leftShoulder:{x:-.4,z:-.85},rightShoulder:{x:-.45,z:.70},leftElbow:{x:-2.25},rightElbow:{x:-.65},leftGrip:{x:.65},rightGrip:{x:.65}}],
    [15.05,{torso:{x:-.08},head:{x:-.08},leftShoulder:{x:-.4,z:-.85},rightShoulder:{x:-.28,z:.72},leftElbow:{x:-2.25},rightElbow:{x:-.5}}],
    [22.95,{torso:{x:-.06},head:{x:-.045},leftShoulder:{x:-.4,z:-.85},rightShoulder:{x:-.3,z:.7},leftElbow:{x:-2.25},rightElbow:{x:-.5}}],
    [24.65,{head:{y:.12},leftShoulder:{x:-.4,z:-.85},leftElbow:{x:-2.25}}],
    [24.84,{head:{y:.12},leftShoulder:{x:.25,z:-.75},leftElbow:{x:-2.25}}],
    [24.95,{head:{y:.12},leftShoulder:{x:.25,z:-.25},leftElbow:{x:-.4}}],
    [25,{head:{x:.08}}],
    [30,{head:{x:.23,z:.025},torso:{x:.1}}]
  ];
  const track=createPoseTrack(rig,keys.map(k=>k[0]),keys.map(k=>pose(rig,k[1])));
  return time=>track(time);
}

export function createRabbitConversation(rig,index) {
  const keys=index===0?[
    [0,{head:{y:-.25,z:.02}}],
    [3.55,{head:{y:-.22,x:-.025},rightShoulder:{x:-.42,z:.53},rightElbow:{x:-.75}}],
    [4.25,{torso:{x:-.025},head:{y:-.22,z:.05},rightShoulder:{x:-.55,z:.65},rightElbow:{x:-.95}}],
    [5.6,{head:{y:-.20,z:-.025},rightShoulder:{x:-.45,z:.58},rightElbow:{x:-.7}}],
    [7.35,{head:{y:-.23,x:.035},rightShoulder:{x:-.6,z:.64},rightElbow:{x:-.9}}],
    [8.1,{head:{y:-.22}}],
    [9.7,{head:{y:-.22,x:-.04}}],
    [10.3,{head:{y:-.19,x:.06},leftShoulder:{x:-.35,z:-.6},rightShoulder:{x:-.35,z:.6},leftElbow:{x:-.8},rightElbow:{x:-.8}}],
    [11.4,{head:{y:-.2}}],
    [14.3,{head:{y:-.3,x:-.045}}],
    [14.8,{head:{y:-.38,x:-.09}}]
  ]:[
    [0,{head:{y:-.28,z:-.06}}],[5,{head:{y:-.22,z:.025}}],
    [9.8,{head:{y:-.3,x:-.045}}],[11.5,{head:{y:-.30,z:-.03}}],
    [14.8,{head:{y:-.4,x:-.09}}]
  ];
  const track=createPoseTrack(rig,keys.map(k=>k[0]),keys.map(k=>pose(rig,k[1])));
  return time=>track(time);
}

export function dialogueState(time) {
  return {
    question:smoothPhase(time,8.15,8.4)*(1-smoothPhase(time,9.35,9.7)),
    acceptance:smoothPhase(time,11.45,11.8)*(1-smoothPhase(time,23,24)),
    reveal:smoothPhase(time,12.9,13.65)*(1-smoothPhase(time,23.6,24.7)),
    fire:smoothPhase(time,14,14.45)*(1-smoothPhase(time,23.2,23.5)),
    sad:smoothPhase(time,28.25,29.0)
  };
}
