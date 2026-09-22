import * as THREE from 'three';
export const mat = color => new THREE.MeshStandardMaterial({color,roughness:.95});
export function mesh(parent,geo,material,pos=[0,0,0],rot=[0,0,0]) {
  const m=new THREE.Mesh(geo,material); m.position.set(...pos); m.rotation.set(...rot); parent.add(m); return m;
}
export function createHeadstone({small=false}={}) {
  const group=new THREE.Group(), stone=mat('#8d999a');
  const profile=new THREE.Shape();profile.moveTo(-.39,0);profile.lineTo(.39,0);profile.lineTo(.39,.66);profile.absarc(0,.66,.39,0,Math.PI,false);profile.lineTo(-.39,0);
  mesh(group,new THREE.ExtrudeGeometry(profile,{depth:.18,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.015,curveSegments:20}),stone,[0,0,-.09]);
  // Inset cross and fine engraved rules are geometry, readable without font assets.
  const ink=mat('#536466');
  mesh(group,new THREE.BoxGeometry(.042,.23,.012),ink,[0,.68,.096]);
  mesh(group,new THREE.BoxGeometry(.16,.04,.013),ink,[0,.72,.097]);
  [.4,.32].forEach((y,i)=>mesh(group,new THREE.BoxGeometry(.35-i*.09,.016,.012),ink,[0,y,.096]));
  mesh(group,new THREE.BoxGeometry(.96,.12,.38),stone,[0,.06,0]);
  if(small) group.scale.setScalar(.8);
  return group;
}
export function createShovel() {
  const group=new THREE.Group();
  mesh(group,new THREE.CylinderGeometry(.035,.035,1.25,12),mat('#b38a50'),[0,.69,0]);
  const blade=mesh(group,new THREE.SphereGeometry(.22,16,12),mat('#758a8c'),[0,.08,0]); blade.scale.set(1,1.3,.17);
  mesh(group,new THREE.TorusGeometry(.105,.026,8,20),mat('#465558'),[0,1.4,0]);
  return group;
}
export function createFlower() {
  const group=new THREE.Group();
  mesh(group,new THREE.CylinderGeometry(.012,.014,.55,8),mat('#4d793f'),[0,.275,0]);
  const leaf=mesh(group,new THREE.SphereGeometry(.09,12,8),mat('#68904b'),[.045,.2,0],[0,0,-.6]); leaf.scale.set(.5,1,.18);
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    const petal=mesh(group,new THREE.SphereGeometry(.068,12,8),mat('#fff7dc'),[Math.cos(a)*.08,.56+Math.sin(a)*.08,0]); petal.scale.set(1,1,.35);
  }
  mesh(group,new THREE.SphereGeometry(.045,12,8),mat('#efb936'),[0,.56,.025]);
  return group;
}
export function createWorld(scene) {
  scene.background=new THREE.Color('#c1d5cf'); scene.fog=new THREE.Fog('#c1d5cf',22,65);
  scene.add(new THREE.HemisphereLight('#fff4de','#687b59',2.8));
  const sun=new THREE.DirectionalLight('#ffdfac',3.2); sun.position.set(-5,12,7);sun.target.position.set(5,0,0);scene.add(sun.target);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-16,right:16,top:12,bottom:-12,near:.5,far:45});sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;scene.add(sun);
  const fill=new THREE.DirectionalLight('#daedff',1.4);fill.position.set(7,5,-3);scene.add(fill);
  const grass=mat('#82956b'), soil=mat('#72513a');
  // A real opening, not a black decal: the bear fits below the surface in the final shot.
  const shape=new THREE.Shape();shape.moveTo(-40,-35);shape.lineTo(40,-35);shape.lineTo(40,35);shape.lineTo(-40,35);shape.closePath();
  const hole=new THREE.Path();hole.moveTo(8.98,-1.8);hole.lineTo(8.98,1.8);hole.lineTo(11.02,1.8);hole.lineTo(11.02,-1.8);hole.closePath();shape.holes.push(hole);
  mesh(scene,new THREE.ShapeGeometry(shape),grass,[0,0,0],[-Math.PI/2,0,0]);
  mesh(scene,new THREE.BoxGeometry(2.04,.12,3.6),soil,[10,-.91,0]);
  [8.94,11.06].forEach(x=>mesh(scene,new THREE.BoxGeometry(.12,.87,3.6),soil,[x,-.45,0]));
  [-1.86,1.86].forEach(z=>mesh(scene,new THREE.BoxGeometry(2.24,.87,.12),soil,[10,-.45,z]));
  const cover=mesh(scene,new THREE.PlaneGeometry(2.04,3.6),grass,[10,.006,0],[-Math.PI/2,0,0]);
  mesh(scene,new THREE.BoxGeometry(18,.025,2.3),mat('#c6b99a'),[1,-.003,3.2]);
  for(let i=0;i<40;i++) {
    mesh(scene,new THREE.BoxGeometry(.025,.01,2.25),mat('#a99d84'),[-8+i*.46,.014,3.2]);
  }
  // Cemetery entrance and its low fence establish the destination in the tracking shot.
  const iron=mat('#475b59'),gate=new THREE.Group();scene.add(gate);
  for(const x of [6.15,10.05]) {
    mesh(gate,new THREE.BoxGeometry(.28,2.5,.35),mat('#969e91'),[x,1.25,1.8]);
    mesh(gate,new THREE.SphereGeometry(.21,12,8),mat('#aeb6a6'),[x,2.58,1.8]);
  }
  const arch=new THREE.CatmullRomCurve3([[6.15,2.5,1.8],[6.6,3,1.8],[8.1,3.22,1.8],[9.6,3,1.8],[10.05,2.5,1.8]].map(p=>new THREE.Vector3(...p)));
  mesh(gate,new THREE.TubeGeometry(arch,32,.045,8,false),iron);
  // Simple stone markers are enough to read as a cemetery, without captions explaining the joke.
  for(const [x,z,r] of [[6,-3,.05],[7.2,-6,-.07],[10,-6,.03],[13,-4,-.06],[14,0,.04],[5,-.7,-.12],[15,-7,.08]]) {
    const stone=createHeadstone({small:true});stone.position.set(x,0,z);stone.rotation.z=r;scene.add(stone);
  }
  for(let i=0;i<24;i++) {
    const x=-13+i*1.5,z=-9-Math.sin(i*2)*2;
    const height=3.8+(i%4)*.4;
    mesh(scene,new THREE.CylinderGeometry(.13,.23,height,8),mat('#77684e'),[x,height/2,z]);
    const crown=mesh(scene,new THREE.IcosahedronGeometry(1.45,1),mat(['#70896a','#91a277','#648169'][i%3]),[x,height,z]);crown.scale.y=1.25;
  }
  const piles=[];
  for(let i=0;i<16;i++) {
    const p=mesh(scene,new THREE.DodecahedronGeometry(.25+(i%3)*.08,0),soil,[11.5+(i%3)*.22,.12,-1.5+Math.floor(i/3)*.55]);p.rotation.set(i,0,i*.8);piles.push(p);
  }
  const dirt=Array.from({length:15},(_,i)=>mesh(scene,new THREE.DodecahedronGeometry(.055+(i%3)*.02,0),soil));
  const flower=createFlower();flower.position.set(8.4,0,.35);scene.add(flower);
  // A few blades mark the solitary flower, whose silhouette remains easy to see.
  for(let i=0;i<5;i++) mesh(scene,new THREE.ConeGeometry(.018,.23+i*.018,4),mat('#567446'),[8.4+(i-2)*.035,.1,.35+(i%2)*.07],[0,0,(i-2)*.18]);
  return {cover,piles,dirt,flower,gate};
}
