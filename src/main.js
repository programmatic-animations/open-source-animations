import * as THREE from 'three';
import { VIDEO_FORMATS, resolveVideoFormat, applyVideoFraming, fitVideoPreview } from './runtime/videoFormat.js';
import { resolveContentSelection, contentFormat, contentParams } from './runtime/contentSelection.js';
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

function startPreview() {
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

const exportMode = isExportMode();
const selection = resolveContentSelection(new URLSearchParams(location.search));
if (!selection.scene) {
  document.body.style.cssText = 'margin:0;background:#101010;color:#fff;font:16px system-ui';
  document.body.innerHTML = '<main style="max-width:620px;margin:12vh auto;padding:24px"><a href="/" style="color:#a8d8ff">← Episodes</a><h1>TikTok videos</h1><p>Portrait · 1080 × 1920</p><p>No videos yet. Your first intro will appear here when it is created.</p><p>MP4 exports save separately in <code>exports/tiktok/</code>.</p></main>';
  return;
}
const thumbnailMode = selection.thumbnail;
const SCENE_CONFIG = selection.scene;
let videoFormat = contentFormat(selection, new URLSearchParams(location.search).get('format'));

const savedEndTime = getSceneEndTime(SCENE_CONFIG.id);
// Full-scene markers from earlier cuts must include newly inserted reactions.
const outdatedDefaultEnd = (SCENE_CONFIG.id === 'honey-betrayal' && savedEndTime === 43) ||
  (SCENE_CONFIG.id === 'death-to-rabbits' && [37, 40].includes(savedEndTime));
let sceneEndTime = Math.min(
  outdatedDefaultEnd ? SCENE_CONFIG.duration : (savedEndTime ?? SCENE_CONFIG.duration),
  SCENE_CONFIG.duration ?? Infinity
);
let assetsLoaded;
const assetsReady = new Promise(resolve => { assetsLoaded = resolve; });
let loadingAssets = false;
THREE.DefaultLoadingManager.onStart = () => { loadingAssets = true; };
THREE.DefaultLoadingManager.onLoad = () => assetsLoaded();

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  videoFormat.width / videoFormat.height,
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
document.body.style.background = '#101010';
Object.assign(renderer.domElement.style, { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' });
function resizePreview() {
  if (exportMode) return;
  const { width, height } = fitVideoPreview(window.innerWidth, window.innerHeight, videoFormat);
  renderer.setSize(width, height);
  camera.aspect = videoFormat.width / videoFormat.height;
  camera.updateProjectionMatrix();
}
resizePreview();

let runtime;
let refreshTransport;

const { update } = SCENE_CONFIG.create({ scene, camera, renderer });
// Fully procedural scenes have no loader callbacks to wait for.
if (!loadingAssets) assetsLoaded();

const exporter = createVideoExporter({
  renderer,
  camera,
  sceneConfig: SCENE_CONFIG,
  collection: selection.collection,
  getVideoFormat: () => videoFormat,
  getSceneEndTime: () => sceneEndTime,
  restartScene: () => runtime.restartFromZero(),
  pauseScene: () => runtime.pause()
});

runtime = createSceneRuntime({
  renderer,
  scene,
  camera,
  update: time => {
    camera.zoom = 1;
    update(time);
    if (!thumbnailMode) applyVideoFraming(camera, videoFormat, getShotAt(SCENE_CONFIG.shots, time).shot);
  },
  duration: SCENE_CONFIG.duration,
  afterRender: (time) => { exporter.onAfterRender(time); refreshTransport?.(time); }
});

if (!exportMode) {
  setupScreenshotButton({
    renderer,
    scene,
    camera,
    filename: `${SCENE_CONFIG.id}.png`,
    getVideoFormat: () => videoFormat,
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
    getSceneEndTime: () => sceneEndTime,
    getVideoFormat: () => videoFormat
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
  Object.assign(navigation.style, { position: 'fixed', top: '16px', left: '16px', display: 'flex', flexWrap: 'wrap', maxWidth: 'calc(100vw - 32px)', gap: '8px', zIndex: 100 });
  function select(label, entries, value, change) {
    const element = document.createElement('select'); element.setAttribute('aria-label', label);
    for (const [id, title] of entries) { const option = new Option(title, id); element.add(option); }
    element.value = value; element.onchange = () => change(element.value); navigation.appendChild(element);
  }
  function navigate(episode, scene) {
    const url = new URL(location.href); url.search = contentParams(selection.collection, episode, scene, videoFormat.id); location.href = url;
  }
  select('Collection', [['episodes', 'Episodes'], ['tiktok', 'TikTok videos']], selection.collection, id => {
    location.href = id === 'tiktok' ? '/?collection=tiktok' : '/';
  });
  select(selection.collection === 'tiktok' ? 'Video' : 'Episode', selection.entries.map(e => [e.id, e.title]), selection.episode.id, id => navigate(id, ''));
  select('Scene', [...selection.episode.scenes.map(s => [s.id, s.title]), ...(selection.episode.thumbnail ? [['thumbnail', 'Thumbnail']] : [])], thumbnailMode ? 'thumbnail' : SCENE_CONFIG.id, id => navigate(selection.episode.id, id));
  if (!thumbnailMode && SCENE_CONFIG.seekable) {
    select('Shot', SCENE_CONFIG.shots.map(s => [s.id, s.title]), getShotAt(SCENE_CONFIG.shots, runtime.getCurrentTime()).shot.id, id => {
      runtime.seek(SCENE_CONFIG.shots.find(s => s.id === id).start); runtime.pause();
    });
    const shotSelect = navigation.lastElementChild;
    const refresh = refreshTransport;
    refreshTransport = time => { refresh?.(time); shotSelect.value = getShotAt(SCENE_CONFIG.shots, time).shot.id; };
  }
  if (!thumbnailMode && selection.collection !== 'tiktok') select('Video format', VIDEO_FORMATS.map(f => [f.id, f.label]), videoFormat.id, id => {
    videoFormat = resolveVideoFormat(id);
    const url = new URL(location.href); url.searchParams.set('format', id); history.replaceState(null, '', url);
    resizePreview();
  });
  if (selection.collection === 'tiktok') {
    const formatLabel = document.createElement('span');
    formatLabel.textContent = 'TikTok · 1080 × 1920';
    formatLabel.style.cssText = 'color:white;background:#25382d;padding:5px 10px;font:13px system-ui';
    navigation.appendChild(formatLabel);
  }
  const mouthLink = document.createElement('a');
  mouthLink.href = '/mouth.html'; mouthLink.textContent = 'Mouth Studio';
  Object.assign(mouthLink.style, { color: '#fff', background: '#25382d', padding: '5px 10px', borderRadius: '4px', font: '13px system-ui', textDecoration: 'none' });
  navigation.appendChild(mouthLink);
  document.body.appendChild(navigation);
}
runtime.start();

window.addEventListener('resize', resizePreview);

}
startPreview();
