import * as THREE from 'three';

export function smoothPhase(time, start, end) {
  const p = THREE.MathUtils.clamp((time - start) / (end - start), 0, 1);
  return p * p * p * (p * (p * 6 - 15) + 10);
}

// Fixed-length two-link IK. Inputs and outputs share one coordinate space.
export function solveTwoBone(root, target, pole, upperLength, lowerLength) {
  if (!(upperLength > 0 && lowerLength > 0)) throw new RangeError('Limb lengths must be positive');
  const direction = target.clone().sub(root);
  const requestedDistance = direction.length();
  if (requestedDistance < 1e-8) direction.set(0, -1, 0); else direction.normalize();
  const distance = THREE.MathUtils.clamp(requestedDistance,
    Math.abs(upperLength - lowerLength) + 1e-6, upperLength + lowerLength - 1e-6);
  const bend = pole.clone().sub(root);
  bend.addScaledVector(direction, -bend.dot(direction));
  if (bend.lengthSq() < 1e-10) {
    bend.set(Math.abs(direction.x) < 0.9 ? 1 : 0, Math.abs(direction.x) < 0.9 ? 0 : 1, 0);
    bend.addScaledVector(direction, -bend.dot(direction));
  }
  bend.normalize();
  const along = (upperLength ** 2 - lowerLength ** 2 + distance ** 2) / (2 * distance);
  const joint = root.clone().addScaledVector(direction, along)
    .addScaledVector(bend, Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2)));
  const end = root.clone().addScaledVector(direction, distance);
  return { joint, end, error: end.distanceTo(target) };
}

export function fitSegment(mesh, start, end) {
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.scale.y = start.distanceTo(end);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
}

// Shape-preserving cubic Hermite: shared tangents at knots, zero endpoint speed,
// no angle wrapping or previous-frame filter. Values remain within knot bounds.
export function createScalarTrack(times, values) {
  if(times.length!==values.length||times.length<2||times.some((t,i)=>!Number.isFinite(t)||(i&&t<=times[i-1]))||values.some(v=>!Number.isFinite(v)))throw new Error('Invalid trajectory');
  const slopes=times.slice(1).map((t,i)=>(values[i+1]-values[i])/(t-times[i]));
  const tangents=values.map((_,i)=>{
    if(!i||i===values.length-1||slopes[i-1]*slopes[i]<=0)return 0;
    const h0=times[i]-times[i-1],h1=times[i+1]-times[i];
    return 3*(h0+h1)/((2*h1+h0)/slopes[i-1]+(h1+2*h0)/slopes[i]);
  });
  return time=>{
    if(time<=times[0])return values[0];if(time>=times.at(-1))return values.at(-1);
    let i=0;while(times[i+1]<time)i++;
    const h=times[i+1]-times[i],u=(time-times[i])/h;
    return (2*u**3-3*u*u+1)*values[i]+(u**3-2*u*u+u)*h*tangents[i]+(-2*u**3+3*u*u)*values[i+1]+(u**3-u*u)*h*tangents[i+1];
  };
}
export function capturePose(rig) {
  return {pelvis:rig.pelvis.position.y,angles:Object.fromEntries(Object.entries(rig.joints).map(([n,j])=>[n,Object.fromEntries(['x','y','z'].map(a=>[a,j.node.rotation[a]]))]))};
}
export function createPoseTrack(rig,times,poses) {
  const pelvis=createScalarTrack(times,poses.map(p=>p.pelvis));
  const tracks=Object.fromEntries(Object.keys(rig.joints).map(n=>[n,Object.fromEntries(['x','y','z'].map(a=>[a,createScalarTrack(times,poses.map(p=>p.angles[n][a]))]))]));
  return time=>{
    rig.reset();rig.pelvis.position.y=pelvis(time);
    for(const [n,axes] of Object.entries(tracks))rig.setJoint(n,Object.fromEntries(Object.entries(axes).map(([a,f])=>[a,f(time)])));
    rig.root.updateWorldMatrix(true,true);
  };
}
