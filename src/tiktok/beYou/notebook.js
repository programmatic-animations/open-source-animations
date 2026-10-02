import * as THREE from 'three';

export function createNotebook() {
  const book=new THREE.Group();book.name='balu-dating-notebook';
  const cover=new THREE.Mesh(new THREE.BoxGeometry(.42,.50,.055),new THREE.MeshStandardMaterial({color:'#345750',roughness:.85}));
  book.add(cover);
  let texture;
  if(typeof document!=='undefined'){
    const canvas=document.createElement('canvas');canvas.width=840;canvas.height=1000;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff6df';ctx.fillRect(0,0,840,1000);
    ctx.strokeStyle='#d6d6c1';ctx.lineWidth=2;
    for(let y=220;y<950;y+=105){ctx.beginPath();ctx.moveTo(50,y);ctx.lineTo(790,y);ctx.stroke();}
    ctx.fillStyle='#557267';ctx.font='bold 53px sans-serif';ctx.fillText('DATING ADVICE',65,160);
    ctx.fillStyle='#303231';ctx.font='bold 79px sans-serif';ctx.fillText('Be myself',95,380);
    texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  }
  const paper=new THREE.Mesh(new THREE.PlaneGeometry(.395,.475),new THREE.MeshStandardMaterial({color:'#fff6df',...(texture?{map:texture}:{}),roughness:.9}));
  paper.position.z=.028;book.add(paper);
  const spineMaterial=new THREE.MeshStandardMaterial({color:'#adb6a6',metalness:.5,roughness:.35});
  for(let i=0;i<8;i++){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.017,.004,5,12),spineMaterial);
    ring.position.set(-.208,-.2+i*.055,.032);book.add(ring);
  }
  const points=Array.from({length:65},(_,i)=>new THREE.Vector3(-.16+.31*i/64,.078-.012*i/64+.002*Math.sin(i*.53),.031));
  const strike=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,.0028,6,false),new THREE.MeshBasicMaterial({color:'#4d2928'}));
  strike.name='cross-out';strike.geometry.setDrawRange(0,0);book.add(strike);
  const scratch=new THREE.Mesh(new THREE.SphereGeometry(.007,8,6),new THREE.MeshBasicMaterial({color:'#502b29'}));
  scratch.visible=false;book.add(scratch);
  function update(progress){
    const count=Math.floor(progress*64)*36;
    strike.geometry.setDrawRange(0,Math.min(64*36,count));
    scratch.visible=progress>0&&progress<1;
    scratch.position.copy(points[Math.min(64,Math.floor(progress*64))]);
  }
  const grip=new THREE.Group();book.add(grip);
  function configureGrip(point){
    const material=new THREE.MeshStandardMaterial({color:'#688879',roughness:.7});
    const contact=new THREE.Mesh(new THREE.SphereGeometry(.025,12,8),material);contact.position.copy(point);grip.add(contact);
    const anchor=new THREE.Vector3(-.18,.02,-.03),delta=anchor.clone().sub(point);
    const bridge=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,delta.length(),8),material);
    bridge.position.copy(point).add(anchor).multiplyScalar(.5);
    bridge.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());grip.add(bridge);
    return contact;
  }
  // The pencil is in Balu's right paw from the opening; ownership never jumps.
  const pen=new THREE.Group();pen.name='balu-pencil';
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.013,.013,.34,8),new THREE.MeshStandardMaterial({color:'#e5bc50',roughness:.8}));
  shaft.rotation.x=Math.PI/2;shaft.position.set(0,-.08,.31);pen.add(shaft);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.013,.07,8),new THREE.MeshStandardMaterial({color:'#42362b'}));
  tip.rotation.x=Math.PI/2;tip.position.set(0,-.08,.515);pen.add(tip);
  const penTip=new THREE.Group();penTip.position.set(0,-.08,.55);pen.add(penTip);
  return {book,cover,paper,strike,scratch,points,pen,penTip,grip,configureGrip,update};
}
