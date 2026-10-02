import * as THREE from 'three';
import { createNativeMouthTest } from './scene.js';
import './style.css';

const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, .05, 30);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.querySelector('#view').append(renderer.domElement);
const controls = Object.fromEntries(['line','play','reset','time','state','camera','emotion','intensity','offset','offset-label','transcript','error'].map(id => [id, document.getElementById(id)]));
const exportButton = document.getElementById('export'), exportState = document.getElementById('export-state');
let manifest, world, audioContext, buffers, source, playing = false, exporting = false, time = 0, anchor = 0, revision = 0;
const selected = () => manifest.lines.find(line => line.id === controls.line.value);
const options = () => ({ lineId: controls.line.value, view: controls.camera.value, emotion: controls.emotion.value, intensity: +controls.intensity.value, syncOffset: +controls.offset.value });
function currentTime() { return playing ? Math.min(selected().duration, audioContext.currentTime - anchor) : time; }
function render() {
  if (!world) return;
  const state = world.update(time, options()); renderer.render(scene, camera);
  controls.time.value = time;
  controls.state.textContent = `${time.toFixed(3)} / ${selected().duration.toFixed(3)} s · mouth ${state.shape}`;
  controls['offset-label'].textContent = `${Math.round(+controls.offset.value * 1000)} ms`;
}
function pause() {
  time = currentTime(); playing = false; revision++;
  if (source) { source.onended = null; source.stop(); source.disconnect(); source = null; }
  controls.play.textContent = 'Play with audio'; render();
}
async function play() {
  const token = ++revision;
  try {
    controls.error.textContent = '';
    audioContext ||= new AudioContext();
    await audioContext.resume();
    if (!buffers) buffers = await Promise.all(manifest.lines.map(async line => audioContext.decodeAudioData(await (await fetch(line.audio)).arrayBuffer())));
    if (token !== revision) return;
    const line = selected(); if (time >= line.duration - .005) time = 0;
    source = audioContext.createBufferSource(); source.buffer = buffers[manifest.lines.indexOf(line)]; source.connect(audioContext.destination);
    anchor = audioContext.currentTime - time; source.start(0, time); playing = true; controls.play.textContent = 'Pause';
    source.onended = () => { if (token !== revision) return; time = line.duration; playing = false; source.disconnect(); source = null; controls.play.textContent = 'Play with audio'; render(); };
  } catch (error) { controls.error.textContent = error.message; }
}
function resize() { if (exporting) return; const view = document.querySelector('#view'); renderer.setSize(view.clientWidth, view.clientHeight); camera.aspect = view.clientWidth / view.clientHeight; camera.updateProjectionMatrix(); render(); }
async function exportTest() {
  pause(); exporting = true; exportButton.disabled = true; controls.error.textContent = '';
  const exportOptions = { ...options(), lineId: undefined, autoView: true };
  const disabled = [controls.play, controls.reset, controls.time, controls.line, controls.camera, controls.emotion, controls.intensity, controls.offset]; disabled.forEach(control => { control.disabled = true; });
  const request = async (url, data) => {
    const response = await fetch(`http://127.0.0.1:5174/native-mouth-test/${url}`, { method: 'POST', body: data });
    const result = await response.json(); if (!response.ok) throw new Error(result.error); return result;
  };
  try {
    const session = await request('start');
    if (Math.abs(session.duration - manifest.duration) > .0001 || session.fingerprint !== manifest.lines.map(line => line.sha256).join(':')) throw new Error('Dialogue changed. Reload this preview before exporting.');
    renderer.setPixelRatio(1); renderer.setSize(1920, 1080, false); camera.aspect = 1920/1080;
    for (let frame = 0; frame < session.frames; frame++) {
      world.update(frame/60, exportOptions); renderer.render(scene, camera);
      const png = await new Promise(resolve => renderer.domElement.toBlob(resolve, 'image/png'));
      if (!png) throw new Error('Could not render frame');
      await request(`${session.id}/frame?index=${frame}`, png);
      if (frame % 30 === 0) exportState.textContent = `Rendering ${Math.round(frame/session.frames*100)}%…`;
    }
    exportState.textContent = 'Encoding MP4 with dialogue…';
    const result = await request(`${session.id}/finish`); exportState.textContent = `Saved: ${result.file}`;
  } catch (error) { controls.error.textContent = error.message; exportState.textContent = 'Export failed'; }
  finally { exporting = false; exportButton.disabled = false; disabled.forEach(control => { control.disabled = false; }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); resize(); }
}
exportButton.onclick = exportTest;
window.addEventListener('resize', resize);
controls.play.onclick = () => playing ? pause() : play();
controls.reset.onclick = () => { pause(); time = 0; render(); };
controls.time.oninput = () => { const target = +controls.time.value; pause(); time = target; render(); };
controls.line.onchange = () => { pause(); time = 0; controls.time.max = selected().duration; controls.transcript.textContent = selected().text; render(); };
for (const name of ['camera','emotion','intensity','offset']) controls[name].oninput = render;
renderer.setAnimationLoop(() => { if (playing) { time = currentTime(); render(); } });
try {
  const response = await fetch('/audio/native-mouth-test/generated/dialogue.json');
  if (!response.ok) throw new Error('Analyze the recordings first: node scripts/analyze-native-mouth-test.mjs');
  manifest = await response.json();
  for (const line of manifest.lines) { const option = new Option(`${line.speaker} · ${line.source}`, line.id); controls.line.add(option); }
  world = createNativeMouthTest({ scene, camera, manifest });
  controls.time.max = selected().duration; controls.transcript.textContent = selected().text;
  controls.play.disabled = controls.reset.disabled = exportButton.disabled = false; resize();
  // Explicit deterministic rendering interface for local QA and frame export.
  window.nativeMouthTest = {
    manifest, renderer, world, camera,
    seek(at, settings = {}) { pause(); time = Math.max(0, Math.min(selected().duration, at)); const state = world.update(time, { ...options(), ...settings }); renderer.render(scene, camera); return { shape: state.shape, open: state.open, lipGap: state.lipGap }; },
    renderFrame(at, width = 1920, height = 1080) { pause(); renderer.setPixelRatio(1); renderer.setSize(width, height, false); camera.aspect = width / height; const state = world.update(at, { autoView: true }); renderer.render(scene, camera); return { speaker: state.line.speaker, localTime: state.localTime, shape: state.shape }; },
    getPlayback() { return { playing, time: currentTime(), audioState: audioContext?.state, activeSources: source ? 1 : 0 }; }
  };
} catch (error) { controls.error.textContent = error.message; }
