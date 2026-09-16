import * as THREE from 'three';
import { EPISODES, resolveSelection } from './episodes/catalog.js';
import { getShotAt } from './runtime/shotTimeline.js';
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
import { setupScreenshotButton } from './export/screenshot.js';

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

const exportMode = isExportMode();
const selection = resolveSelection(new URLSearchParams(location.search));
const thumbnailMode = selection.thumbnail;
const SCENE_CONFIG = selection.scene;

const savedEndTime = getSceneEndTime(SCENE_CONFIG.id);
// The old full-scene marker must include the newly inserted reaction.
let sceneEndTime = Math.min(
  SCENE_CONFIG.id === 'honey-betrayal' && savedEndTime === 43 ? SCENE_CONFIG.duration : (savedEndTime ?? SCENE_CONFIG.duration),
  SCENE_CONFIG.duration ?? Infinity
);
let assetsLoaded;
const assetsReady = new Promise(resolve => { assetsLoaded = resolve; });
THREE.DefaultLoadingManager.onLoad = () => assetsLoaded();

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
let refreshTransport;

const { update } = SCENE_CONFIG.create({ scene, camera, renderer });

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
  duration: SCENE_CONFIG.duration,
  afterRender: (time) => { exporter.onAfterRender(time); refreshTransport?.(time); }
});

if (!exportMode) {
  setupScreenshotButton({
    renderer,
    scene,
    camera,
    filename: `${SCENE_CONFIG.id}.png`,
    saveToProject: thumbnailMode
  });
}

// Video controls apply to animated scenes.
if (!exportMode && !thumbnailMode) {
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

if (exportMode && !thumbnailMode) {
  assetsReady.then(() => exporter.startExport());
}

if (!exportMode && !thumbnailMode) {
  const transport = document.createElement('div');
  Object.assign(transport.style, { position: 'fixed', bottom: '18px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '12px', background: '#161510df', color: '#fff', font: '12px system-ui', width: 'min(620px, 85vw)' });
  const play = document.createElement('button'); play.textContent = 'Pause';
  const slider = document.createElement('input'); slider.type = 'range'; slider.min = '0'; slider.max = String(SCENE_CONFIG.duration); slider.step = '0.01'; slider.disabled = !SCENE_CONFIG.seekable; slider.style.flex = '1'; slider.setAttribute('aria-label', 'Scene time');
  const label = document.createElement('span'); label.style.minWidth = '170px';
  play.onclick = () => { if (runtime.isPaused()) { if (runtime.getCurrentTime() >= SCENE_CONFIG.duration) { if (!SCENE_CONFIG.seekable) { location.reload(); return; } runtime.seek(0); } runtime.resume(); } else runtime.pause(); };
  slider.oninput = () => { runtime.seek(Number(slider.value)); runtime.pause(); };
  refreshTransport = time => { slider.value = time; play.textContent = runtime.isPaused() ? 'Play' : 'Pause'; label.textContent = `${time.toFixed(1)}s · ${getShotAt(SCENE_CONFIG.shots, time).shot.title}`; };
  transport.append(play, slider, label); document.body.appendChild(transport);
  const requestedTime = new URLSearchParams(location.search).get('t');
  if (SCENE_CONFIG.seekable && requestedTime !== null && Number.isFinite(Number(requestedTime))) { runtime.seek(Number(requestedTime)); runtime.pause(); }
}
if (!exportMode) {
  const navigation = document.createElement('div');
  Object.assign(navigation.style, { position: 'fixed', top: '16px', left: '16px', display: 'flex', gap: '8px', zIndex: 100 });
  function select(label, entries, value, change) {
    const element = document.createElement('select'); element.setAttribute('aria-label', label);
    for (const [id, title] of entries) { const option = new Option(title, id); element.add(option); }
    element.value = value; element.onchange = () => change(element.value); navigation.appendChild(element);
  }
  function navigate(episode, scene) {
    const url = new URL(location.href); url.search = new URLSearchParams({ episode, scene }); location.href = url;
  }
  select('Episode', EPISODES.map(e => [e.id, e.title]), selection.episode.id, id => navigate(id, ''));
  select('Scene', [...selection.episode.scenes.map(s => [s.id, s.title]), ['thumbnail', 'Thumbnail']], thumbnailMode ? 'thumbnail' : SCENE_CONFIG.id, id => navigate(selection.episode.id, id));
  if (!thumbnailMode && SCENE_CONFIG.seekable) {
    select('Shot', SCENE_CONFIG.shots.map(s => [s.id, s.title]), getShotAt(SCENE_CONFIG.shots, runtime.getCurrentTime()).shot.id, id => {
      runtime.seek(SCENE_CONFIG.shots.find(s => s.id === id).start); runtime.pause();
    });
    const shotSelect = navigation.lastElementChild;
    const refresh = refreshTransport;
    refreshTransport = time => { refresh?.(time); shotSelect.value = getShotAt(SCENE_CONFIG.shots, time).shot.id; };
  }
  document.body.appendChild(navigation);
}
runtime.start();

window.addEventListener('resize', () => {
  if (exportMode) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});
