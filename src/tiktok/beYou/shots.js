import { defineShots } from '../../runtime/shotTimeline.js';

// Preserve the dialogue windows; subdivide the silent visual escalation.
const verticalZoom = (16 / 9) / (9 / 16);
const balu = { position: [-.88, 1.65, 5.4], target: [-.95, 1.38, .12] };
const rabbits = { position: [1.96, 1.55, 3.75], target: [2.0, 1.28, .08] };
const wind = { position: [2.34, 1.35, 6.8], target: [2.31, 1.19, -.1] };

export const SHOTS = defineShots([
  { id: 'balu-question', title: 'Balu · how to get a girlfriend bro?', duration: 3.6, view: balu },
  { id: 'rabbit-advice', title: 'Rabbit · be yourself', duration: 4.5, view: rabbits },
  { id: 'balu-check', title: 'Balu · be myself?', duration: 1.6, view: balu },
  { id: 'rabbit-confirm', title: 'Rabbit · do not hold back', duration: 1.7, view: rabbits },
  { id: 'balu-okay', title: 'Balu · Vokey', duration: 1.1, view: balu },
  { id: 'power-up', title: 'Power-up · fingers pop', duration: 1.35, special: 'hand' },
  { id: 'eyes-ignite', title: 'Power-up · eyes ignite', duration: 1.05,
    view: { position: [-.85, 1.8, 2.6], target: [-.95, 1.72, .1] } },
  { id: 'aura-release', title: 'Power-up · full authentic self', duration: 3.6,
    view: { position: [-.55, .85, 8.7], target: [-.95, 1.85, 0] }, shake: .028 },
  { id: 'rabbit-correction', title: 'Rabbit · be someone else!', duration: 4.5, view: wind, push: .25, shake: .02 },
  { id: 'rabbit-recovery', title: 'Rabbits · steady after the gush', duration: 2,
    view: { position: [2.34, 1.35, 6.55], target: wind.target }, push: -.40 },
  { id: 'notebook-tag', title: 'Balu · takes out his notebook', duration: 1.7,
    view: { position: [-.8, 1.65, 5.4], target: [-.85, 1.35, .1] } },
  { id: 'notebook-insert', title: 'Cross out · Be myself', duration: 1.65, special: 'notebook' },
  { id: 'sad-button', title: 'Balu · quiet disappointment', duration: 1.65, special: 'sad' }
].map(({ view, ...shot }) => ({
  ...shot, verticalZoom,
  update({ camera, progress, shotTime, sceneTime, actors, effects }) {
    const ease = progress * progress * (3 - 2 * progress);
    camera.up.set(0,1,0);
    camera.fov = 40;
    if(shot.special==='hand'){
      const point=actors.balu.hands.right.wrist.localToWorld(camera.position.clone().set(0,-.235,.025));
      camera.position.copy(point).add({x:.12,y:.22,z:1.8-.1*ease});camera.lookAt(point);
    }else if(shot.special==='notebook'){
      const point=actors.notebook.book.getWorldPosition(camera.position.clone());
      const quaternion=actors.notebook.book.getWorldQuaternion(camera.quaternion.clone());
      const normal=camera.position.clone().set(0,0,1).applyQuaternion(quaternion);
      const up=normal.clone().set(0,1,0).applyQuaternion(quaternion);
      camera.up.copy(up);camera.position.copy(point).addScaledVector(normal,1.3-.05*ease).addScaledVector(up,.03);camera.lookAt(point);
    }else if(shot.special==='sad'){
      const point=actors.balu.visual.headGroup.getWorldPosition(camera.position.clone());point.y+=.025;point.z+=.12;
      camera.position.copy(point).add({x:.06,y:.08,z:2.9-.20*ease});camera.lookAt(point);
    }else{
      camera.position.fromArray(view.position);camera.position.z-=(shot.push??.12)*ease;
      if(shot.shake){
        const force=effects.aura.visible?1:0;
        camera.position.x+=shot.shake*Math.sin(sceneTime*47)*force;
        camera.position.y+=shot.shake*.6*Math.sin(sceneTime*39)*force;
      }
      camera.lookAt(...view.target);
    }
  }
})));

export const DURATION = SHOTS.at(-1).end;
export const CUES = Object.fromEntries(SHOTS.map(shot=>[shot.id,shot.start]));
