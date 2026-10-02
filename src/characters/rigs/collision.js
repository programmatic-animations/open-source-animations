import * as THREE from 'three';
const V = () => new THREE.Vector3();

// Convex hull of each procedural mesh, preserving its actual scale and orientation.
// Concave props should be supplied as several convex child meshes.
export function meshVolumes(root, part = 'prop') {
  const result = [];
  root.traverse(node => {
    if (!node.isMesh) return;
    const attr = node.geometry.attributes.position, points = [], seen = new Set();
    for (let i=0;i<attr.count;i++) {
      const p=V().fromBufferAttribute(attr,i), key=p.toArray().join(',');
      if(!seen.has(key)){seen.add(key);points.push(p);}
    }
    result.push({id:`${part}:${result.length}`,part,node,points});
  });
  return result;
}
export function boxVolume(id, min, max) {
  const points=[];
  for(const x of [min.x,max.x])for(const y of [min.y,max.y])for(const z of [min.z,max.z])points.push(new THREE.Vector3(x,y,z));
  return {id,part:id,node:new THREE.Object3D(),points};
}
export function worldVolume(volume, space) {
  const matrix=new THREE.Matrix4().copy(space.matrixWorld).invert().multiply(volume.node.matrixWorld);
  const points=volume.points.map(p=>p.clone().applyMatrix4(matrix));
  return {...volume,points,box:new THREE.Box3().setFromPoints(points)};
}
function support(points,d){let best=points[0],dot=-Infinity;for(const p of points){const v=p.dot(d);if(v>dot){dot=v;best=p;}}return best.clone();}
const triple=(a,b,c)=>a.clone().cross(b).cross(c);
function simplex(s,d) {
  const a=s[0],ao=a.clone().negate(),b=s[1],ab=b.clone().sub(a);
  if(s.length===2){if(ab.dot(ao)>0)d.copy(triple(ab,ao,ab));else{s.splice(1);d.copy(ao);}return false;}
  const c=s[2],ac=c.clone().sub(a),abc=ab.clone().cross(ac);
  if(s.length===3){
    if(abc.clone().cross(ac).dot(ao)>0){if(ac.dot(ao)>0){s.splice(1,1);d.copy(triple(ac,ao,ac));}else{s.splice(2);return simplex(s,d);}}
    else if(ab.clone().cross(abc).dot(ao)>0){s.splice(2);return simplex(s,d);}
    else if(abc.dot(ao)>0)d.copy(abc);else{[s[1],s[2]]=[s[2],s[1]];d.copy(abc).negate();}
    return false;
  }
  const e=s[3];
  for(const [u,v,opposite] of [[b,c,e],[c,e,b],[e,b,c]]){
    const normal=u.clone().sub(a).cross(v.clone().sub(a));
    if(normal.dot(opposite.clone().sub(a))>0)normal.negate();
    if(normal.dot(ao)>0){s.splice(0,s.length,a,u,v);d.copy(normal);return false;}
  }
  return true;
}
// GJK convex intersection. Tiny support erosion permits touching surfaces;
// it is a contact tolerance, never a blanket exemption for a held object.
export function intersects(a,b,tolerance=0.002) {
  if(!a.box.intersectsBox(b.box))return false;
  const d=new THREE.Vector3(1,.31,.17),s=[];
  for(let i=0;i<48;i++){
    const p=support(a.points,d).sub(support(b.points,d.clone().negate())).addScaledVector(d.clone().normalize(),-tolerance);
    if(p.dot(d)<0)return false;
    s.unshift(p);
    if(s.length>1&&simplex(s,d))return true;
    if(s.length===1)d.copy(p).negate();
    if(d.lengthSq()<1e-20)return true;
  }
  return true; // Conservative failure on an unresolved degenerate simplex.
}
export function checkCollisions(rig,{propVolumes=[],obstacles=[],ground=0,tolerance=.002}={}) {
  rig.root.updateWorldMatrix(true,true);
  for(const v of [...propVolumes,...obstacles])v.node.updateWorldMatrix(true,false);
  const bodies=rig.collision.volumes.map(v=>worldVolume(v,rig.root));
  const props=propVolumes.map(v=>worldVolume(v,rig.root));
  const solids=obstacles.map(v=>worldVolume(v,rig.root)),hits=[];
  const pairKey=(a,b)=>[a,b].sort().join('|');
  for(const a of [...bodies,...props]){
    if(a.box.min.y<ground-tolerance)hits.push({a:a.part,b:'ground'});
    for(const b of solids)if(intersects(a,b,tolerance))hits.push({a:a.part,b:b.part});
  }
  for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
    const a=bodies[i],b=bodies[j];
    if(a.part===b.part||rig.collision.exceptions.has(pairKey(a.part,b.part)))continue;
    if(intersects(a,b,tolerance))hits.push({a:a.part,b:b.part});
  }
  for(const a of bodies)for(const b of props)if(intersects(a,b,tolerance))hits.push({a:a.part,b:b.part});
  return hits;
}

// Surface contact is distinct from reachability: reaching empty space is not a grip.
export function surfaceDistance(root, worldPoint) {
  root.updateWorldMatrix(true,true);
  let distance=Infinity;
  const triangle=new THREE.Triangle(),closest=V();
  root.traverse(node=>{
    if(!node.isMesh)return;
    const {index,attributes:{position}}=node.geometry;
    for(let i=0;i<(index?.count??position.count);i+=3){
      for(const [j,p] of [triangle.a,triangle.b,triangle.c].entries())p.fromBufferAttribute(position,index?index.getX(i+j):i+j).applyMatrix4(node.matrixWorld);
      triangle.closestPointToPoint(worldPoint,closest);distance=Math.min(distance,closest.distanceTo(worldPoint));
    }
  });
  return distance;
}
