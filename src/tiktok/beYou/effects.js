import * as THREE from 'three';
import { smoothPhase } from '../../characters/actions/mechanics.js';

const vertexShader = `uniform float uTime; uniform float uStrength; varying float vHeight;
void main(){ vec3 p=position; vHeight=uv.y;
 p.x += sin(uTime*9.0+p.y*5.0+position.z*8.0)*0.075*uv.y*uStrength;
 p.z += cos(uTime*7.0+p.y*4.0)*0.07*uv.y*uStrength;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`;
const fragmentShader = `uniform vec3 uColor; uniform float uStrength; uniform float uTime;
varying float vHeight; void main(){float flicker=0.78+0.22*sin(vHeight*15.0-uTime*13.0);
 float alpha=uStrength*(1.0-vHeight*0.62)*flicker;
 gl_FragColor=vec4(uColor*(1.25+0.3*(1.0-vHeight)),alpha); }`;

function flameGeometry(width,height) {
  const positions=[],uvs=[],indices=[];
  for(let i=0;i<=14;i++){
    const p=i/14, w=width*(1-p)*(.75+.25*Math.sin(p*11));
    const center=.12*Math.sin(p*7)*p;
    positions.push(center-w,p*height,0,center+w,p*height,0);
    uvs.push(0,p,1,p);
    if(i<14){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);return geometry;
}

export function createPowerEffects(scene,balu) {
  const aura=new THREE.Group();scene.add(aura);
  const shellMaterial=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uStrength:{value:0}},
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec2 vUv; uniform float uTime;uniform float uStrength;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      float fbm(vec2 p){float f=0.0,a=.5;for(int i=0;i<4;i++){f+=a*noise(p);p=p*2.03;a*=.5;}return f;}
      void main(){float y=vUv.y,x=abs(vUv.x-.5);float n=fbm(vec2(vUv.x*8.0,y*6.0-uTime*3.2));
       float width=.48-.33*y+.12*(n-.45)*y;
       float edge=smoothstep(width,width-.035,x);
       float crest=1.0-smoothstep(.76+.18*n,.91+.09*n,y);
       float core=smoothstep(.28,.06,x)*(.7+.3*n);
       vec3 c=mix(vec3(.13,.5,1.0),vec3(.66,.18,1.0),smoothstep(.44,.16,x));
       c=mix(c,vec3(1.0,.70,.16),core*.8);c+=vec3(.6,.5,.2)*core*(1.0-y);
       gl_FragColor=vec4(c*1.35,edge*crest*uStrength*(.32+.28*n));}`,
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending
  });
  const shell=new THREE.Mesh(new THREE.PlaneGeometry(3.4,4.4),shellMaterial);
  shell.position.set(0,2.15,-.82);aura.add(shell);
  const flames=[];
  const palette=['#65cfff','#ad62ff','#ffe45c','#ff794a'];
  for(let i=0;i<32;i++){
    const angle=i/32*Math.PI*2;
    const radius=.77+(i%3)*.12;
    const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,
      uniforms:{uTime:{value:0},uStrength:{value:0},uColor:{value:new THREE.Color(palette[i%4])}},
      transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
    const flame=new THREE.Mesh(flameGeometry(.16+(i%4)*.05,2.7+(i%5)*.26),material);
    flame.position.set(Math.cos(angle)*radius,.06,Math.sin(angle)*radius);
    flame.rotation.y=-angle+Math.PI/2;
    // Keep the foreground center open: the bear's expression is the joke.
    if(flame.position.z>.1&&Math.abs(flame.position.x)<.58)flame.position.z=-.9;
    aura.add(flame);flames.push(flame);
  }
  const light=new THREE.PointLight('#ad75ff',0,9,1.8);light.position.set(-.95,1.6,1);scene.add(light);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.025,6,80),new THREE.MeshBasicMaterial({color:'#84dcff',transparent:true,opacity:0,depthWrite:false}));
  ring.rotation.x=-Math.PI/2;scene.add(ring);
  const streaks=[];
  const streakMaterial=new THREE.MeshBasicMaterial({color:'#cfeeff',transparent:true,opacity:.32,depthWrite:false});
  for(let i=0;i<22;i++){
    const streak=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,.55+(i%4)*.15,5),streakMaterial);
    streak.rotation.z=-Math.PI/2;scene.add(streak);streaks.push(streak);
  }
  const leaves=[];
  const leafMats=['#ac7e38','#64894e','#d2a052'].map(color=>new THREE.MeshStandardMaterial({color,roughness:.9,side:THREE.DoubleSide}));
  for(let i=0;i<34;i++){
    const leaf=new THREE.Mesh(new THREE.CircleGeometry(.05+(i%3)*.018,5),leafMats[i%3]);
    const origin=new THREE.Vector3(-2.3+(i%9)*.63,.025,1.2-Math.floor(i/9)*.7);
    leaf.rotation.x=-Math.PI/2;leaf.position.copy(origin);scene.add(leaf);leaves.push({leaf,origin});
  }
  function update(t,{start=14.9,stop=23}={}){
    const strength=smoothPhase(t,start,start+.27)*(1-smoothPhase(t,stop,stop+.10));
    aura.visible=strength>.001;aura.position.copy(balu.root.position);
    for(const [i,flame]of flames.entries()){
      flame.material.uniforms.uTime.value=t+i*.19;
      flame.material.uniforms.uStrength.value=strength*(.47+.11*Math.sin(t*12+i));
    }
    shellMaterial.uniforms.uTime.value=t;shellMaterial.uniforms.uStrength.value=strength;
    light.intensity=14*strength;
    const ringP=(t-start)/.8;
    ring.visible=ringP>=0&&ringP<1;ring.position.set(balu.root.position.x,.04,balu.root.position.z);
    ring.scale.setScalar(.25+Math.max(0,ringP)*5);ring.material.opacity=Math.max(0,1-ringP)*.75;
    streaks.forEach((streak,i)=>{
      streak.visible=strength>.02;const cycle=((t-start)*2.4+i*.113)%1;
      streak.position.set(-.7+cycle*5.6,(i%3===0?2.30:.10)+(i%3)*.09,-.3+(i%5)*.48);
    });
    for(const [i,{leaf,origin}]of leaves.entries()){
      const elapsed=Math.max(0,Math.min(t,stop)-start-i*.012);
      const moving=t>=start+i*.012;
      const phase=elapsed*(1.9+(i%4)*.2);
      const lifted=new THREE.Vector3(origin.x+elapsed*.43,.15+(1+Math.sin(phase+i))*.65,origin.z+.13*Math.sin(phase*.7+i));
      leaf.position.copy(moving?lifted:origin);
      if(t>stop){
        const fall=t-stop;
        leaf.position.x+=Math.min(fall,1.3)*.5;
        leaf.position.y=Math.max(.026,lifted.y-.2*fall-2.5*fall*fall);
      }
      leaf.rotation.set(moving?phase:.5*Math.PI,i*.41,moving?phase*.6:0);
    }
    return strength;
  }
  return {aura,light,flames,shell,leaves,streaks,ring,update};
}
