import * as THREE from 'three';
import { createBear } from '../characters/bear.js';
import { createHoneycomb } from '../props/honeycomb.js';
import { createRabbit } from '../characters/rabbit.js';

export const SCENE_CONFIG = {
  id: 'bear-ep1-thumbnail',
  title: 'The Bear — Ep1 Thumbnail'
};

function createTitleCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 700;
  
    const ctx = canvas.getContext('2d');
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  
    // Main title
    ctx.font = '900 150px Arial Black, Arial, sans-serif';
    ctx.lineJoin = 'round';
  
    // Thick dark outline
    ctx.strokeStyle = '#3a1d08';
    ctx.lineWidth = 42;
    ctx.strokeText('THE BEAR', 800, 265);
  
    // Warm yellow fill
    ctx.fillStyle = '#ffc928';
    ctx.fillText('THE BEAR', 800, 265);
  
    // Episode label
    ctx.font = '900 145px Arial Black, Arial, sans-serif';
  
    ctx.strokeStyle = '#3a1d08';
    ctx.lineWidth = 28;
    ctx.strokeText('EP 1', 800, 520);
  
    ctx.fillStyle = '#ffffff';
    ctx.fillText('EP 1', 800, 520);

    // Small episode name
    ctx.font = '900 90px Arial Black, Arial, sans-serif';

    ctx.strokeStyle = '#ffd86c';
    ctx.lineWidth = 16;
    ctx.strokeText('HONEY TRAP', 800, 640);

    ctx.fillStyle = '#000';
    ctx.fillText('HONEY TRAP', 800, 640);
  
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
  
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
  
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5.4, 2.36),
      material
    );
  
    mesh.renderOrder = 10;
  
    return mesh;
  }

export function createBearEp1Thumbnail({ scene, camera }) {
    // Background tuned for a bright clickable poster look
    scene.background = new THREE.Color(0xbfe7ff);

    // Camera: 16:9 thumbnail framing
    camera.fov = 40;
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 1, 0);
    camera.updateProjectionMatrix();

    // Clear any old lights if needed later; for now just add thumbnail lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 8, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xfff1c1, 1.4);
    rimLight.position.set(-5, 4, -3);
    scene.add(rimLight);

    // Bear
    const {
    bear,
    headGroup,
    leftArm,
    rightArm
    } = createBear();

    bear.position.set(-2.6, -0.6, 0);
    bear.scale.setScalar(1.82);
    bear.rotation.y = 0.18;

    // Poster-style expression / pose
    headGroup.rotation.x = -0.08;
    headGroup.rotation.z = -0.14;

    leftArm.rotation.x = -0.35;
    leftArm.rotation.z = -0.55;
    leftArm.rotation.y = 0.5;

    rightArm.rotation.x = -1;
    rightArm.rotation.z = 0.55;
    rightArm.rotation.y = -0.5;

    scene.add(bear);

    // Honey Comb
    const honeycomb = createHoneycomb();

    honeycomb.position.set(-1.8, 0.15, 1.2);
    honeycomb.scale.setScalar(3);

    honeycomb.rotation.z = -0.18;
    honeycomb.rotation.y = -0.2;

    // Text Card
    const titleCard = createTitleCard();

    titleCard.position.set(1.1, 2.6, 0.2);

    scene.add(titleCard);

    scene.add(honeycomb);

    // Bunnies
    const {
        rabbit: bunny1,
        body: bunny1Body,
        headGroup: bunny1HeadGroup
      } = createRabbit();
      
      bunny1Body.visible = false;
      
      bunny1.position.set(3.65, -0.15, 0.15);
      bunny1.scale.setScalar(1.05);
      bunny1.rotation.y = -0.55;
      
      bunny1HeadGroup.scale.setScalar(1.5);
      bunny1HeadGroup.rotation.x = 0.08;
      bunny1HeadGroup.rotation.z = -0.08;
      
      scene.add(bunny1);

      const {
        rabbit: bunny2,
        body: bunny2Body,
        headGroup: bunny2HeadGroup
      } = createRabbit({
        color: 0xd8d8d8,
        bellyColor: 0xf0eeee
      });
      
      bunny2Body.visible = false;
      bunny2.position.set(3.25, -1.85, 0.1);
      bunny2.scale.setScalar(0.95);
      bunny2.rotation.y = -0.42;
      bunny2HeadGroup.scale.setScalar(1.45);
      bunny2HeadGroup.rotation.x = 0.06;
      bunny2HeadGroup.rotation.z = -0.04;
      scene.add(bunny2);
      
      const {
        rabbit: bunny3,
        body: bunny3Body,
        headGroup: bunny3HeadGroup
      } = createRabbit({
        color: 0x8c8c8c,
        bellyColor: 0xcacaca
      });
      
      bunny3Body.visible = false;
      bunny3.position.set(2, -1, -0.05);
      bunny3.scale.setScalar(0.9);
      bunny3.rotation.y = -0.6;
      bunny3HeadGroup.scale.setScalar(1.35);
      bunny3HeadGroup.rotation.x = 0.08;
      bunny3HeadGroup.rotation.z = -0.08;
      scene.add(bunny3);
      
      const {
        rabbit: bunny4,
        body: bunny4Body,
        headGroup: bunny4HeadGroup
      } = createRabbit({
        color: 0x8b684d,
        bellyColor: 0xc9ad92
      });
      
      bunny4Body.visible = false;
      bunny4.position.set(1.2, -2.5, 0.05);
      bunny4.scale.setScalar(1.0);
      bunny4.rotation.y = -0.35;
      bunny4HeadGroup.scale.setScalar(1.45);
      bunny4HeadGroup.rotation.x = 0.08;
      bunny4HeadGroup.rotation.z = 0.05;
      scene.add(bunny4);  

    return {
    update() {}
    };
}