import * as THREE from 'three';
import { createBear } from '../../characters/bear.js';
import { getShotAt } from '../../runtime/shotTimeline.js';
import { SHOTS,DURATION,cue,IMPACT,LANDING } from './shots.js';
import { createWorld,createCar,box,mat } from './props.js';

export const SCENE_CONFIG={id:'tiktok-capitol-crossing-main',title:'The coast is clear',duration:DURATION,shots:SHOTS,seekable:true};
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const phase=(t,a,b)=>ease((t-a)/(b-a));
const v=(x,y,z)=>new THREE.Vector3(x,y,z);
const lerp=THREE.MathUtils.lerp;
export function createCapitolCrossingScene({scene,camera,renderer}){
  const world=createWorld(scene),a=createBear({position:{x:0,y:0,z:5}});scene.add(a.bear);
  if(renderer){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;}
  const eyes=a.headGroup.children.filter(n=>Math.abs(Math.abs(n.position.x)-.17)<.001&&n.position.y===.1);
  const eyeHomes=eyes.map(e=>e.position.clone());
  const brows=[-1,1].map(side=>box(a.headGroup,[.16,.037,.04],[side*.17,.23,.465],mat('#36251d')));
  const crosses=new THREE.Group();a.headGroup.add(crosses);
  for(const x of [-.17,.17])for(const sign of [-1,1]){
    const slash=box(crosses,[.20,.045,.045],[x,.1,.49],mat('#211b1a'));slash.rotation.z=sign*Math.PI/4;
  }
  const mouth=new THREE.Group();mouth.position.set(0,-.25,.572);a.headGroup.add(mouth);
  const hole=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),mat('#382027'));hole.scale.set(1,.6,.26);mouth.add(hole);
  const tongue=new THREE.Mesh(new THREE.CapsuleGeometry(.063,.13,5,12),mat('#ef8091'));tongue.position.set(.06,-.09,.04);tongue.rotation.z=.35;tongue.scale.z=.35;mouth.add(tongue);
  const watch=new THREE.Group();a.leftArm.add(watch);watch.position.set(0,-.57,0);
  const strap=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.14,16),mat('#283e46'));watch.add(strap);
  const face=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.035,20),mat('#eee9d7'));face.rotation.x=Math.PI/2;face.position.z=.16;watch.add(face);
  box(watch,[.012,.09,.016],[0,.027,.185],mat('#23343b'));const hand=box(watch,[.075,.012,.016],[.03,0,.187],mat('#23343b'));
  const phone=new THREE.Group();a.rightArm.add(phone);phone.position.set(0,-.63,.12);
  box(phone,[.26,.46,.06],[0,0,0],mat('#243339'));box(phone,[.22,.38,.008],[0,.01,.035],mat('#a0d9e8'));
  for(let i=0;i<3;i++)box(phone,[.14,.024,.01],[-.015,.10-i*.085,.043],mat(i?'#ecf5ef':'#4a8799'));
  // Local wardrobe: a curved tie follows the chest instead of sinking into it.
  const tie=new THREE.Group();a.bear.add(tie);
  const silk=mat('#842d40');silk.side=THREE.DoubleSide;
  const knot=box(tie,[.14,.13,.075],[0,1.40,.36],silk);knot.rotation.z=Math.PI/4;
  const blade=new THREE.BufferGeometry();
  blade.setAttribute('position',new THREE.Float32BufferAttribute([
    -.055,1.34,.405, .055,1.34,.405, -.11,.88,.512,
    .055,1.34,.405, .11,.88,.512, -.11,.88,.512,
    -.11,.88,.512, .11,.88,.512, 0,.70,.495
  ],3));blade.computeVertexNormals();tie.add(new THREE.Mesh(blade,silk));
  const passes=[];const colors=['#bd6650','#dfbe5d','#698f94','#e9e1ce','#597080'];
  for(const lane of [0,1]){
    const centers=[-1,.05,1.2,2.35,3.5,4.65,5.45,8.40,8.80,9.20,9.60];
    centers.forEach((center,i)=>{const vehicle=createCar(colors[(i+lane*2)%colors.length]);scene.add(vehicle.car);passes.push({...vehicle,center:center+lane*.12,lane,speed:center>7?17:11});});
  }
  const impactCar=createCar('#b93430');scene.add(impactCar.car);
  scene.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});
  const startQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.PI,0));
  const endQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,-.42));
  function look(pos,target,fov){camera.fov=fov;camera.up.set(0,1,0);camera.position.copy(pos);camera.lookAt(target);}
  function walk(t){const s=Math.sin(t*9);a.leftLeg.rotation.x=s*.5;a.rightLeg.rotation.x=-s*.5;a.leftArm.rotation.x=-s*.34;a.rightArm.rotation.x=s*.34;a.bear.position.y=Math.abs(s)*.035;}
  function update(raw){
    const time=THREE.MathUtils.clamp(raw,0,DURATION),{shot,time:t}=getShotAt(SHOTS,time),id=shot.id;
    a.bear.position.set(0,0,5);a.bear.rotation.set(0,Math.PI,0);a.headGroup.rotation.set(0,0,0);
    [a.leftArm,a.rightArm,a.leftLeg,a.rightLeg].forEach(n=>{n.rotation.set(0,0,0);n.scale.set(1,1,1);});
    a.leftArm.rotation.z=-.25;a.rightArm.rotation.z=.25;
    a.leftLeg.position.set(-.3,.32,0);a.rightLeg.position.set(.3,.32,0);
    eyes.forEach((e,i)=>{e.visible=time<LANDING;e.scale.set(1,1,1);e.position.copy(eyeHomes[i]);});crosses.visible=time>=LANDING;mouth.visible=time>=LANDING;
    phone.rotation.set(0,Math.PI,0);
    phone.visible=true;
    brows.forEach((b,i)=>{b.visible=time<LANDING;b.rotation.z=0;b.position.y=.23;});
    passes.forEach(p=>{
      const dir=p.lane?-1:1,x=(time-p.center)*p.speed*dir;p.car.position.set(x,0,p.lane?-2:2);p.car.rotation.set(0,p.lane?Math.PI:0,0);p.car.visible=Math.abs(x)<65;
      p.wheels.forEach(w=>w.rotation.y=time*p.speed/.32);
    });
    const dt=time-IMPACT;impactCar.car.visible=time>=IMPACT-1.5;
    const carX=dt<0?-2.2+20*dt:-2.2+20*(Math.min(dt,.3)-Math.min(dt,.3)**2/.6);
    impactCar.car.position.set(carX,0,2);impactCar.car.rotation.set(0,0,0);
    impactCar.wheels.forEach(w=>w.rotation.y=carX/.32);
    a.bear.position.y=.012*Math.sin(time*3);
    a.headGroup.rotation.y=.13*Math.sin(time*1.9);
    if(id==='watch'){
      const lift=phase(t,0,.3)*(1-phase(t,1.3,1.7));a.leftArm.rotation.set(-1.15*lift,0,-.25+.65*lift);a.headGroup.rotation.set(.38*lift,.3*lift,0);
    }
    if(id==='phone'){
      const lift=phase(t,0,.28)*(1-phase(t,1.4,1.8));a.rightArm.rotation.set(-1.15*lift,0,.25-.75*lift);phone.rotation.set(1.15*lift,Math.PI,0);a.headGroup.rotation.set(.25*lift,.18*lift,0);
      // Aim the existing bead eyes at the real screen; keep them on the head surface.
      a.bear.updateMatrixWorld(true);
      const screen=a.headGroup.worldToLocal(phone.localToWorld(v(0,.01,.04)));
      const gaze=phase(t,.12,.38)*(1-phase(t,1.4,1.8));
      eyes.forEach((eye,i)=>{
        const direction=screen.clone().sub(eyeHomes[i]).normalize();
        eye.position.x+=direction.x*.075*gaze;eye.position.y+=direction.y*.075*gaze;
        const surface=Math.sqrt(.25-eye.position.x**2-eye.position.y**2)-.01;
        eye.position.z=lerp(eyeHomes[i].z,surface,gaze);
      });
    }
    if(id==='false-gap'){
      const retreat=1-phase(t,1.63,1.83),step=phase(t,.10,.47)*retreat;
      const tiny=phase(t,.50,.88)*retreat,third=phase(t,.93,1.32)*retreat,recoil=phase(t,1.62,1.79)*(1-phase(t,1.97,2.5));
      a.bear.position.z=5-.48*step-.16*tiny-.18*third+.38*recoil;a.bear.rotation.x=-.1*step+.2*recoil;
      a.leftLeg.position.z=.55*step-.16*tiny+.18*third;a.leftLeg.position.y=.32+.10*(Math.sin(Math.PI*phase(t,.10,.47))+Math.sin(Math.PI*phase(t,.93,1.32)))*retreat;a.leftLeg.rotation.x=-.38*step;
      a.rightLeg.position.z=.23*tiny;a.rightLeg.position.y=.32+.09*Math.sin(Math.PI*phase(t,.50,.88))*retreat;a.rightLeg.rotation.x=-.2*tiny;
      a.leftArm.rotation.x=-1.3*recoil;a.rightArm.rotation.x=-1.4*recoil;
      a.leftArm.rotation.z=-.25-.6*recoil;a.rightArm.rotation.z=.25+.6*recoil;
      eyes.forEach(e=>e.scale.setScalar(1+.4*recoil));a.headGroup.rotation.set(-.15*recoil,0,0);
    }
    if(time>=cue('false-gap').start+2.5&&time<cue('crossing').start){
      brows.forEach((b,i)=>{b.rotation.z=(i?1:-1)*.35;b.position.y=.18;});
      a.leftArm.rotation.z=-.5;a.rightArm.rotation.z=.5;a.headGroup.rotation.y=0;
    }
    if(id==='angry'){a.headGroup.rotation.x=-.12;a.leftArm.rotation.x=-.25;a.rightArm.rotation.x=-.25;a.bear.position.y=.035*Math.sin(t*5);}
    if(id==='left')a.headGroup.rotation.y=1.2*phase(t,0,.3);
    if(id==='right')a.headGroup.rotation.y=lerp(1.2,-1.2,phase(t,0,.4));
    if(id==='crossing'){
      const travel=Math.min(t,IMPACT-shot.start);a.bear.position.z=5-travel*1.25;a.headGroup.rotation.y=-1.2*(1-phase(t,0,.3));walk(t);
      if(dt>=0){
        const p=clamp(dt/(LANDING-IMPACT));a.bear.position.set(4.9*p,.55*p+3.1*Math.sin(Math.PI*p),2.1875-.7*p);
        a.bear.quaternion.slerpQuaternions(startQ,endQ,ease(p));a.headGroup.rotation.set(0,0,-.13*p);
        a.leftArm.rotation.set(-1.2-.5*p,0,-1.1);a.rightArm.rotation.set(.6,0,1.8);
        a.leftLeg.rotation.set(-.45,0,-.55);a.rightLeg.rotation.set(.8,0,.85);
        if(dt>=LANDING-IMPACT){const settle=time-LANDING;a.bear.position.y=.55+Math.max(0,1-settle/.4)*.16*Math.abs(Math.sin(settle*16));}
      }
    }
    if(id==='waiting')look(v(3.5,8,23),v(0,3.5,-10),47);
    if(id==='watch'||id==='phone')look(v(-2.3,2.65,1.95),v(0,1.25,5),40);
    if(id==='false-gap')look(v(-5.4,3.8,9.8),v(0,1,3.9),47);
    if(id==='angry')look(v(-.45,2.15,1.75),v(0,1.6,5),38);
    if(id==='left')look(v(5.8,3.4,9),v(-4,1,1.9),52);
    if(id==='right')look(v(-5.8,3.4,9),v(4,1,1.9),52);
    // One elevated rear three-quarter take; gently follow the flight without cutting.
    if(id==='crossing'){
      const follow=2.7*phase(time,IMPACT,LANDING+.3);
      const overhead=phase(time,LANDING+.25,DURATION-.35);
      const drift=t/shot.duration;
      const position=v(4+follow,12.8,16.5).lerp(v(3.8,15,2.5),overhead).add(v(.08*drift,.24*drift,-.35*drift));
      const target=v(follow,.4,2).lerp(v(3.4,.4,1),overhead).add(v(.03*drift,0,-.05*drift));
      look(position,target,lerp(48,52,overhead));
    }
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    return {shot:id,time:t};
  }
  update(0);
  return {config:SCENE_CONFIG,update,actors:{...a,eyes,brows,crosses,mouth},props:{...world,watch,phone,tie,passes,impactCar}};
}
