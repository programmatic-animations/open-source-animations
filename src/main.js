import * as THREE from 'three';
import {
  SCENE_CONFIG,
  createPitRabbitsScene
} from './scenes/pitRabbits.js';
// import {
//   SCENE_CONFIG,
//   createProgrammaticIntroScene
// } from './scenes/programmaticIntro.js';
import { createSceneRuntime } from './runtime/sceneRuntime.js';
import {
  getSceneEndTime,
  setupSceneEndButton
} from './runtime/sceneEnd.js';
import {
  isExportMode,
  setupExportButton,
  createVideoExporter
} from './export/recorder.js';

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

const exportMode = isExportMode();

let sceneEndTime = getSceneEndTime(SCENE_CONFIG.id);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 4, 8);
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

document.body.innerHTML = '';
document.body.appendChild(renderer.domElement);

let runtime;

const { update } = createPitRabbitsScene({ scene, camera, renderer });
// const { update } = createProgrammaticIntroScene({ scene, camera, renderer });

const exporter = createVideoExporter({
  renderer,
  camera,
  sceneConfig: SCENE_CONFIG,
  getSceneEndTime: () => sceneEndTime,
  restartScene: () => runtime.restartFromZero(),
  pauseScene: () => runtime.pause()
});

runtime = createSceneRuntime({
  renderer,
  scene,
  camera,
  update,
  afterRender: exporter.onAfterRender
});

if (!exportMode) {
  let exportControls;

  setupSceneEndButton({
    sceneId: SCENE_CONFIG.id,
    sceneEndTime,
    getCurrentTime: () => runtime.getCurrentTime(),

    onSetEnd: (time) => {
      sceneEndTime = time;
      runtime.pause();

      exportControls?.refresh();
    }
  });

  exportControls = setupExportButton({
    getSceneEndTime: () => sceneEndTime
  });
}

if (exportMode) {
  exporter.startExport();
}

runtime.start();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});
