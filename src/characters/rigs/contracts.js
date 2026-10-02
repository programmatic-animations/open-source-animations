const radians = degrees => degrees * Math.PI / 180;
const limits = (x = [0, 0], y = [0, 0], z = [0, 0]) => Object.fromEntries(Object.entries({x,y,z}).map(([axis, range]) => [axis, range.map(radians)]));
// Versioned working anatomy. Positions are character-local; lengths never animate.
export const CHARACTER_RIGS = {
  balu: { version: 2, bodyScale: [.9,.7,.65], restShoulder: .25, shinClearance: .065, pelvis: 0.65, torsoCenter: 0.40, head: 1.0, shoulder: [0.65, 0.74, 0],
    upperArm: 0.43, forearm: 0.43, thigh: 0.325, shin: 0.325, hipWidth: 0.3, paw: [0.14, 0.17, 0.12],
    limits: { torso: limits([-20,65],[-30,30],[-15,15]), head: limits([-30,35],[-65,65],[-20,20]),
      shoulder: limits([-150,80],[-85,85],[-85,85]), elbow: limits([-150,-5]), wrist: limits([-35,35],[-25,25],[-15,15]),
      hip: limits([-85,45],[-25,25],[-20,20]), knee: limits([0,135]), ankle: limits([-50,50]), grip: limits([0,55]) } },
  rabbit: { version: 2, bodyScale: [.9,.7,.8], restShoulder: .4, shinClearance: .065, pelvis: 0.30, torsoCenter: 0.30, head: 0.85, shoulder: [0.42,0.48,0],
    upperArm: 0.24, forearm: 0.23, thigh: 0.15, shin: 0.15, hipWidth: 0.20, paw: [0.085,0.11,0.08],
    limits: { torso: limits([-25,55],[-35,35],[-20,20]), head: limits([-35,40],[-75,75],[-25,25]),
      shoulder: limits([-150,85],[-85,85],[-85,85]), elbow: limits([-150,-5]), wrist: limits([-40,40],[-25,25],[-20,20]),
      hip: limits([-95,50],[-30,30],[-25,25]), knee: limits([0,140]), ankle: limits([-60,60]), grip: limits([0,55]),
      ear: limits([-35,50],[-15,15],[-25,25]), jaw: limits([0,25]) } }
};

// Only anatomically joined parts may overlap. Meshes within one part form a solid union.
export function connectedCollisionPairs() {
  const pairs=[['torso','head'],['head','jaw']];
  for(const side of ['left','right'])pairs.push(
    ['torso',`${side}Shoulder`],['torso',`${side}Hip`],
    [`${side}Shoulder`,`${side}Elbow`],[`${side}Elbow`,`${side}Wrist`],
    [`${side}Wrist`,`${side}Grip`],[`${side}Elbow`,`${side}Grip`],
    [`${side}Hip`,`${side}Knee`],[`${side}Knee`,`${side}Ankle`],['head',`${side}Ear`]);
  return pairs;
}
