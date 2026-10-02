import * as THREE from 'three';
import { smoothPhase } from '../../characters/actions/mechanics.js';

// Local facial controls. Speaking muzzle remains clear for the user's overlay.
export function createFace(rig) {
  const rabbit = rig.character === 'rabbit';
  const head = rig.visual.headGroup;
  const eyeX = rabbit ? .15 : .17;
  const eyeY = rabbit ? .08 : .1;
  const eyeZ = rabbit ? .36 : .45;
  const originalEyes = rabbit ? [rig.visual.leftEye, rig.visual.rightEye] :
    head.children.filter(n => n.isMesh && Math.abs(Math.abs(n.position.x) - eyeX) < .001 && n.position.y === eyeY);
  originalEyes.forEach(eye => { eye.visible = false; });
  const white = new THREE.MeshStandardMaterial({ color: '#fff2d7', roughness: .55 });
  const black = new THREE.MeshStandardMaterial({ color: '#21191b', roughness: .7 });
  const eyes = [], brows = [];
  for (const side of [-1, 1]) {
    const socket = new THREE.Group(); socket.position.set(side * eyeX, eyeY, eyeZ + .025); head.add(socket);
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(rabbit ? .074 : .068, 16, 12), white);
    sclera.scale.z = .55; socket.add(sclera);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(rabbit ? .034 : .032, 12, 10), black);
    pupil.position.z = .042; socket.add(pupil);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(.009, 8, 6), new THREE.MeshBasicMaterial({color:'#fffaf2'}));
    glint.position.set(-.01,.012,.025); pupil.add(glint);
    const fireMaterial = new THREE.MeshBasicMaterial({ color: '#ffbe4b', transparent: true, opacity: 0 });
    const fire = new THREE.Mesh(new THREE.SphereGeometry(.074, 12, 10), fireMaterial);
    fire.scale.z = .5; fire.position.z = .055; socket.add(fire);
    const flameShape=new THREE.Shape();flameShape.moveTo(-.035,0);flameShape.quadraticCurveTo(-.08,.10,-.012,.17);flameShape.quadraticCurveTo(.005,.09,.032,.03);flameShape.closePath();
    const flareMaterial=new THREE.MeshBasicMaterial({color:'#ff6a35',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false});
    const flare=new THREE.Mesh(new THREE.ShapeGeometry(flameShape),flareMaterial);flare.position.set(0,.035,.085);socket.add(flare);
    eyes.push({socket,sclera,pupil,fire,fireMaterial,flare,flareMaterial});
    const brow = new THREE.Group(); brow.position.set(side * eyeX, eyeY + .115, eyeZ + .03); head.add(brow);
    const arc = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.08,0,0),new THREE.Vector3(0,.027,.012),new THREE.Vector3(.08,0,0));
    brow.add(new THREE.Mesh(new THREE.TubeGeometry(arc,12,.018,6,false),black)); brows.push(brow);
  }
  const smileMaterial = new THREE.MeshStandardMaterial({color:'#392324',transparent:true,opacity:0});
  const smileCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.13,-.23,.53),new THREE.Vector3(0,-.30,.60),new THREE.Vector3(.13,-.23,.53));
  const smile = new THREE.Mesh(new THREE.TubeGeometry(smileCurve,20,.012,6,false),smileMaterial);
  if(!rabbit) head.add(smile);
  function update({time=0,gaze=0,question=0,confidence=0,fear=0,sad=0,fire=0,smiling=0,blink=0}={}) {
    eyes.forEach((eye,i) => {
      eye.sclera.scale.y = Math.max(.06, (1 + .45*fear + .10*question - .26*sad)*(1-.94*blink));
      eye.pupil.position.set(.023*gaze, -.019*sad + .004*question, .046);
      eye.pupil.scale.setScalar(1-.35*fear);
      eye.fire.visible=fire>.001; eye.fireMaterial.opacity=.94*fire;
      eye.fire.scale.y=1+.17*Math.sin(time*23+i)*fire;
      eye.flare.visible=fire>.001;eye.flareMaterial.opacity=fire*.8;eye.flare.scale.y=1+.17*Math.sin(time*19+i);
      const side=i?1:-1;
      brows[i].position.y=eyeY+.115+.045*fear+.035*question*(i? .25:1)-.018*confidence+.014*sad;
      brows[i].rotation.z=side*(.06*confidence-.24*fear-.38*sad)+(!i?-.16*question:0);
    });
    smileMaterial.opacity=smiling;
    if(rabbit)rig.setJoint('jaw',{x:.07+.19*fear});
  }
  return { eyes,brows,smile,update };
}

export function blinkAt(time, centers) {
  return centers.reduce((value,center)=>Math.max(value,
    smoothPhase(time,center-.075,center)*(1-smoothPhase(time,center,center+.11))),0);
}
