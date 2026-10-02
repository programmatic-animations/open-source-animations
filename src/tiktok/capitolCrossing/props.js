import * as THREE from 'three';
export const mat = color => new THREE.MeshStandardMaterial({color,roughness:.82});
export function box(parent,size,pos,material){
  const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.set(...pos);parent.add(m);return m;
}
function cylinder(parent,r1,r2,h,pos,material,n=20){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,n),material);m.position.set(...pos);parent.add(m);return m;
}
function label(text,w,h,bg,fg){
  if(typeof document==='undefined')return mat(bg);
  const c=document.createElement('canvas');c.width=1024;c.height=256;
  const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);
  ctx.fillStyle=fg;ctx.font='bold 92px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,132,960);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({map:tex});
}
// East elevation reference: central portico, symmetrical wings, tiered drum and tall dome.
// Kept as low-cost geometry so all cameras share correct perspective and light.
export function createCapitol(){
  const g=new THREE.Group(),stone=mat('#d8ccb2'),trim=mat('#eee2c9'),glass=mat('#46585d'),roof=mat('#85877c');
  box(g,[23,6.2,5],[0,3.3,0],stone);
  for(const x of [-9,9])box(g,[5,7.1,5.5],[x,3.6,.1],stone);
  for(const y of [.4,2.6,4.5,6.5])box(g,[24,.18,5.8],[0,y,.1],trim);
  for(let x=-10;x<=10;x+=1.35)for(const y of [1.5,3.5,5.4]){
    box(g,[.68,1.05,.09],[x,y,2.55],glass);
    box(g,[.87,.12,.16],[x,y+.6,2.62],trim);
  }
  box(g,[5.2,6.8,2],[0,3.5,3.1],stone);
  for(const x of [-1.8,-.6,.6,1.8]){
    cylinder(g,.17,.21,4.8,[x,3.65,4.35],trim);
    box(g,[.52,.22,.52],[x,1.26,4.35],trim);box(g,[.5,.2,.5],[x,6.08,4.35],trim);
  }
  box(g,[5.7,.32,2.2],[0,6.32,3.8],trim);
  const tri=new THREE.Shape();tri.moveTo(-3,0);tri.lineTo(3,0);tri.lineTo(0,1.35);tri.closePath();
  const pediment=new THREE.Mesh(new THREE.ExtrudeGeometry(tri,{depth:.35,bevelEnabled:false}),trim);pediment.position.set(0,6.5,4.75);g.add(pediment);
  for(let i=0;i<7;i++)box(g,[6+i*.3,.18,1.2+i*.34],[0,1.12-i*.16,4.1+i*.18],stone);
  cylinder(g,2.2,2.5,1.1,[0,7.1,0],trim);
  cylinder(g,1.72,1.9,2.9,[0,9,0],stone);
  for(let i=0;i<16;i++){
    const a=i*Math.PI/8,x=Math.sin(a)*1.87,z=Math.cos(a)*1.87;
    cylinder(g,.085,.1,2.5,[x,9,z],trim,8);
  }
  cylinder(g,2.04,2.04,.26,[0,10.55,0],trim);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1.92,32,20,0,Math.PI*2,0,Math.PI/2),roof);dome.scale.y=1.5;dome.position.y=10.6;g.add(dome);
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,pts=[];
    for(let j=0;j<=24;j++){const t=j/24*Math.PI/2;pts.push(new THREE.Vector3(Math.cos(t)*1.94*Math.sin(a),10.6+Math.sin(t)*2.9,Math.cos(t)*1.94*Math.cos(a)));}
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.025,5,false),trim));
  }
  cylinder(g,.38,.5,.85,[0,13.7,0],trim);cylinder(g,0,.48,.85,[0,14.55,0],roof);
  cylinder(g,.035,.035,1.2,[0,15.35,0],trim,8);
  const sign=box(g,[4.7,.42,.05],[0,6.31,4.94],label('MICHIGAN',4.7,.42,'#ddd1b9','#514c43'));
  return g;
}
export function createCar(color='#b9352d'){
  const car=new THREE.Group(),paint=mat(color),dark=mat('#202932'),glass=mat('#8baeb9'),chrome=mat('#d5dcd7');
  box(car,[3.5,.58,1.55],[0,.66,0],paint);
  box(car,[1.85,.6,1.35],[-.2,1.22,0],paint);
  box(car,[1.48,.42,1.38],[-.18,1.23,0],glass);
  box(car,[.12,.5,1.43],[-.18,1.24,0],paint);
  box(car,[1.95,.12,1.43],[-.2,1.57,0],paint);
  box(car,[.08,.35,1.2],[.78,1.22,0],glass);
  box(car,[.12,.17,1.6],[1.74,.49,0],chrome);
  for(const z of [-.54,.54]){box(car,[.08,.2,.31],[1.78,.78,z],mat('#fff0bb'));box(car,[.08,.18,.3],[-1.78,.78,z],mat('#aa2724'));}
  const wheels=[];
  for(const x of [-1.08,1.08])for(const z of [-.79,.79]){
    const wheel=cylinder(car,.32,.32,.17,[x,.34,z],dark,16);wheel.rotation.x=Math.PI/2;wheels.push(wheel);
    const hub=cylinder(car,.16,.16,.18,[x,.34,z],chrome,12);hub.rotation.x=Math.PI/2;
  }
  return {car,wheels};
}
export function createWorld(scene){
  scene.background=new THREE.Color('#bbd8e4');scene.fog=new THREE.Fog('#bbd8e4',48,100);
  scene.add(new THREE.HemisphereLight('#f4f3e7','#6c7b84',2.4));
  const sun=new THREE.DirectionalLight('#ffe5b8',3.1);sun.position.set(-12,23,13);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:1,far:80});sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;scene.add(sun);
  const road=mat('#48545e'),pavement=mat('#c9c4b5'),curb=mat('#e3ddcd'),grass=mat('#78986a'),line=mat('#f3d778');
  box(scene,[160,.2,100],[0,-.22,-20],grass);
  box(scene,[160,.16,8],[0,-.10,0],road);
  for(const z of [-5.1,5.1]){box(scene,[160,.22,2.2],[0,-.05,z],pavement);box(scene,[160,.25,.18],[0,.005,Math.sign(z)*4.02],curb);}
  for(const z of [-.1,.1])box(scene,[160,.015,.075],[0,-.009,z],line);
  for(let z=-3.5;z<=3.5;z+=1)box(scene,[2,.015,.42],[0,0,z],mat('#e7e5d8'));
  box(scene,[5,.07,20],[0,-.09,-15],pavement);
  const capitol=createCapitol();capitol.position.set(0,0,-29);scene.add(capitol);
  const pole=mat('#344648');
  for(const x of [-10,10])for(const z of [-6,6]){
    cylinder(scene,.07,.11,4,[x,2,z],pole,10);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.25,12,8),mat('#faf1d3'));lamp.position.set(x,4.05,z);scene.add(lamp);
  }
  for(const x of [-15,-9,9,15])for(const z of [-16,-23]){
    cylinder(scene,.17,.24,3,[x,1.5,z],mat('#7e644d'),9);
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(2.3,1),mat('#60815b'));crown.position.set(x,3.9,z);crown.scale.y=1.2;scene.add(crown);
  }
  const post=cylinder(scene,.045,.06,2.7,[-3,1.35,5.5],pole,8);
  box(scene,[2,.42,.08],[-3,2.6,5.5],label('CAPITOL AVE',2,.42,'#315c50','#ffffff'));
  return {capitol};
}
