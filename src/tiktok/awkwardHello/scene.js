import * as THREE from 'three';
import { createBear } from '../../characters/bear.js';
import { createMonkey } from '../../characters/monkey.js';
import { getShotAt } from '../../runtime/shotTimeline.js';
import { SHOTS, DURATION, cue, TURN_START, travelPose } from './shots.js';
import { createWorld, createHeadstone, createShovel, mat } from './props.js';

export const SCENE_CONFIG={id:'tiktok-awkward-hello-main',title:'He only said hi',duration:DURATION,shots:SHOTS,seekable:true};
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const lerp=THREE.MathUtils.lerp;
const phase=(t,a,b)=>ease((t-a)/(b-a));
const v=(x,y,z)=>new THREE.Vector3(x,y,z), down=v(0,-1,0);

export function createAwkwardHelloScene({scene,camera,renderer}) {
  const world=createWorld(scene);
  if(renderer){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;}
  const a=createBear(),m=createMonkey();scene.add(a.bear,m.monkey);
  const eyes=a.headGroup.children.filter(n=>Math.abs(Math.abs(n.position.x)-.17)<.001&&n.position.y===.1);
  const brows=[-1,1].map(side=>{
    const b=new THREE.Mesh(new THREE.CapsuleGeometry(.019,.12,4,10),mat('#38291e'));
    b.position.set(side*.17,.22,.455);a.headGroup.add(b);return b;
  });
  // Local tired-eye additions preserve the shared bear used in other videos.
  const bags=[-1,1].map(side=>{
    const g=new THREE.Group();g.position.set(side*.17,.062,.479);
    const arc=new THREE.QuadraticBezierCurve3(v(-.065,0,-.008),v(0,-.075,.008),v(.065,0,-.008));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(arc,18,.016,8,false),mat('#493327')));
    const crease=new THREE.QuadraticBezierCurve3(v(-.052,-.035,-.012),v(0,-.071,0),v(.052,-.035,-.012));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(crease,16,.007,6,false),mat('#75513a')));
    a.headGroup.add(g);return g;
  });
  const lids=[-1,1].map(side=>{
    const lid=new THREE.Mesh(new THREE.SphereGeometry(.062,18,12),mat('#6b4226'));
    lid.position.set(side*.17,.14,.469);lid.scale.set(1,.48,.42);a.headGroup.add(lid);return lid;
  });
  const stone=createHeadstone();stone.position.set(10,0,-2.03);scene.add(stone);
  const shovel=createShovel();scene.add(shovel);
  const load=new THREE.Mesh(new THREE.DodecahedronGeometry(.18,1),mat('#72513a'));
  load.scale.set(1,.6,.6);load.position.set(0,.08,.08);shovel.add(load);
  scene.traverse(n=>{if(n.isMesh){n.receiveShadow=true;n.castShadow=!['PlaneGeometry','ShapeGeometry'].includes(n.geometry.type);}});
  const handTargets=[v(0,0,0),v(0,0,0)];
  function handsAt(left,right){
    a.bear.updateMatrixWorld(true);
    [left,right].forEach((target,i)=>{
      const arm=i?a.rightArm:a.leftArm,delta=a.bear.worldToLocal(target.clone()).sub(arm.position);
      arm.quaternion.setFromUnitVectors(down,delta.clone().normalize());
      arm.scale.y=delta.length()/.7;handTargets[i].copy(target);
    });
  }
  function look(position,target,fov=40){camera.fov=fov;camera.up.set(0,1,0);camera.position.copy(position);camera.lookAt(target);}
  function walk(time){
    const brisk=phase(time,TURN_START,TURN_START+.55),cycle=time*8+Math.max(0,time-TURN_START)*4;
    const swing=Math.sin(cycle),stride=lerp(.36,.52,brisk);
    a.leftLeg.rotation.x=swing*stride;a.rightLeg.rotation.x=-swing*stride;
    a.leftLeg.position.y=.32+Math.max(0,swing)*.055;a.rightLeg.position.y=.32+Math.max(0,-swing)*.055;
    a.leftArm.rotation.x=-swing*.3;a.rightArm.rotation.x=swing*.3;
    a.bear.position.y=Math.abs(swing)*.025;a.bear.rotateX(.07*brisk);
  }
  function update(raw){
    const time=THREE.MathUtils.clamp(raw,0,DURATION),{shot,time:t,progress:p}=getShotAt(SHOTS,time),id=shot.id;
    const path=travelPose(time);
    a.bear.position.set(path.x,0,path.z);a.bear.rotation.set(0,path.yaw,0);
    a.headGroup.rotation.set(0,0,0);a.body.scale.set(.9,1.2,.75);
    [a.leftArm,a.rightArm,a.leftLeg,a.rightLeg].forEach(n=>{n.rotation.set(0,0,0);n.scale.set(1,1,1);});
    a.leftArm.rotation.z=-.25;a.rightArm.rotation.z=.25;
    a.leftLeg.position.set(-.3,.32,0);a.rightLeg.position.set(.3,.32,0);
    const stress=phase(time,cue('realization').start+.15,cue('realization').start+.65);
    eyes.forEach(e=>e.scale.set(1,lerp(1,.64,stress),1));
    brows.forEach((b,i)=>{b.position.y=lerp(.255,.198,stress);b.rotation.z=Math.PI/2+(i?-1:1)*.12*(1-stress);});
    bags.forEach(b=>{b.visible=stress>0;b.scale.set(1,stress,1);});
    lids.forEach(l=>{l.visible=stress>0;l.position.y=lerp(.16,.113,stress);});
    m.monkey.visible=time<cue('walk').start;
    m.monkey.position.set(1.6-time*.56,Math.abs(Math.sin(time*8))*.025,4.08);m.monkey.rotation.set(0,-Math.PI/2,0);
    m.head.rotation.set(0,.75*phase(time,.9,1.5),0);
    [m.leftArm,m.rightArm].forEach((arm,i)=>arm.rotation.set(Math.sin(time*8)*(i?1:-1)*.3,0,(i?1:-1)*.12));
    m.leftLeg.rotation.x=Math.sin(time*8)*.43;m.rightLeg.rotation.x=-Math.sin(time*8)*.43;
    m.brows.forEach(b=>{b.position.y=.195;b.rotation.z=Math.PI/2;});
    world.gate.visible=time<cue('dig').start||id==='overhead';
    const dug=time>=cue('dig').start;
    world.cover.visible=!dug;world.cover.scale.set(1,1,1);
    world.piles.forEach((pile,i)=>{pile.visible=dug;pile.scale.setScalar(.55+(i%3)*.12);});
    world.dirt.forEach(d=>d.visible=false);
    shovel.visible=dug;shovel.position.set(11.8,.08,.5);shovel.rotation.set(Math.PI/2,0,.25);load.visible=false;
    world.flower.position.set(8.4,0,.35);world.flower.rotation.set(0,0,0);
    if(time<cue('dig').start){
      walk(time);
      a.headGroup.rotation.y=-.85*phase(time,1.1,1.5)*(1-stress);
      a.headGroup.rotation.x=.065*stress;
      if(id==='hi'){m.rightArm.rotation.set(-.5,0,2.2+Math.sin(t*9)*.12);m.head.rotation.z=-.05;}
      if(id==='reply'){a.leftArm.rotation.set(-.65,0,-.5);a.headGroup.rotation.x=-.07+.04*Math.sin(t*5);}
      if(id==='monkey'){
        const raised=phase(t,.08,.42);m.brows[0].position.y=.195+.105*raised;m.brows[0].rotation.z=Math.PI/2-.23*raised;
        m.head.rotation.z=-.1*raised;m.head.rotation.x=.055*Math.sin(clamp((t-.85)/.5)*Math.PI);
      }
      if(id==='realization'){a.leftArm.rotation.x*=1-stress*.7;a.rightArm.rotation.x*=1-stress*.7;}
      const bx=a.bear.position.x,bz=a.bear.position.z,mx=m.monkey.position.x;
      if(id==='stroll')look(v(bx+2.4,2.3,9.1-p*.5),v(bx+.3,1.1,3.2),44);
      if(id==='hi')look(v((bx+mx)/2+.8,2.1,8.8-p*.25),v((bx+mx)/2,1.25,3.45),44);
      if(id==='reply')look(v(bx+2.5,1.95,6.25-p*.15),v(bx+.06,1.58,3),37);
      if(id==='monkey')look(v(mx-2.1,1.78,6.6-p*.2),v(mx,1.51,4.08),37);
      if(id==='realization')look(v(bx+3.3,1.9,bz+lerp(2.1,1.65,ease(p))),v(bx+.2,1.66,bz),36);
      if(id==='walk')look(v(bx-2.7,3.25, bz+5.7),v(bx+.7,1, bz-.65),47);
    }else if(id==='dig'){
      // Reference: Fleury's shoveling extremes — plant, hinge, lift, tip, recovery.
      // One weighted scoop, already inside the hollow; the rim masks the feet.
      const jab=phase(t,0,.42),lift=phase(t,.48,1.24),tip=phase(t,1.24,1.58),recover=phase(t,1.85,2.6);
      a.bear.position.set(9.67+.12*lift,-.82-.09*jab+.23*lift-.08*recover,0);
      a.bear.rotation.set(0,Math.PI/2,0);a.bear.rotateX(.18+.25*jab-.30*lift+.18*recover);
      a.headGroup.rotation.x=.13*jab-.09*lift;
      const blade=v(10.27+.18*jab+.30*lift-.18*recover,-.44-.3*jab+1.05*lift-.55*recover,0);
      shovel.position.copy(blade);shovel.rotation.set(0,0,.35+.15*jab-.15*lift+.02*tip+.1*recover);
      shovel.updateMatrixWorld(true);
      handsAt(shovel.localToWorld(v(0,.88,0)),shovel.localToWorld(v(0,.55,0)));
      load.visible=t>.36&&t<1.5;
      // Detach dirt from the actual moving blade, then follow a ballistic arc.
      const release=v(10.75,.31,0),flight=t-1.5;
      world.dirt.forEach((d,i)=>{
        d.visible=flight>=0&&flight<.64;
        d.position.set(release.x+flight*(1.8+i*.055),release.y+flight*(2.5+i*.035)-4.9*flight*flight,release.z+(i-7)*.018+flight*.26);
        d.rotation.set(time*3+i,i,time*2);
      });
      look(v(12.25-p*.2,.95,4.3),v(10.05,.48,-.1),46);
    }else if(id==='flower'){
      // Tight insert: only the reaching paw and the flower matter.
      a.bear.position.set(8.43,-.31,-.35);a.bear.rotation.set(.18,0,0);
      const reach=phase(t,0,.32),pluck=phase(t,.38,.62);
      world.flower.position.set(8.4,.34*pluck,.35);world.flower.rotation.z=-.16*pluck;
      const left=v(lerp(7.9,8.4,reach),lerp(.68,.22,reach)+.34*pluck,lerp(.2,.35,reach));
      handsAt(left,v(9,.45,-.1));
      look(v(8.85,.92,2.3),v(8.4,.52,.35),38);
    }else{
      // Hard cut: already lying down. A still beat before the overhead pullback.
      a.bear.position.set(10,-.34,.98);a.bear.rotation.set(-Math.PI/2,0,0);
      a.bear.updateMatrixWorld(true);
      handsAt(a.bear.localToWorld(v(-.16,1,.46)),a.bear.localToWorld(v(.16,1,.46)));
      world.flower.position.copy(a.bear.localToWorld(v(0,.62,.51)));world.flower.quaternion.copy(a.bear.quaternion);
      camera.fov=42;camera.up.set(0,0,-1);
      camera.position.set(10,lerp(5.5,11.7,phase(t,.65,shot.duration)),.05);camera.lookAt(10,-.3,.05);
    }
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);return {shot:id,time:t};
  }
  update(0);
  return {config:SCENE_CONFIG,update,actors:{...a,eyes,brows,bags,lids,monkey:m},props:{...world,stone,shovel,load},handTargets};
}
