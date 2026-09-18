import * as THREE from 'three';
import { createMouth } from './mouth.js';
import { poseAt } from './cues.js';
import './studio.css';
const API = 'http://127.0.0.1:5174/speech';
document.body.innerHTML = `<main><header><a href="/">← Animation preview</a><span>STANDALONE OVERLAY</span></header><h1>Mouth Studio<span>Give your character a voice.</span></h1><div class="layout"><section class="preview"><div id="canvas"></div><div class="transport"><button id="play" disabled>Play</button><input aria-label="Speech timeline" id="seek" type="range" min="0" max="1" step="0.001" value="0" disabled><output id="time">0.00 / 0.00 s</output></div><p>The checkerboard is a preview only. Your export has a transparent background.</p></section><aside><h2>1. Add your recording</h2><label class="upload">Choose audio<input id="file" type="file" accept="audio/*"></label><p id="filename">Up to 120 seconds · 30 MB</p><label>Speech language<select id="language"><option value="english">English</option><option value="other">Other languages (phonetic)</option></select></label><button id="analyze" disabled>Create lip sync</button><h2>2. Preview & export</h2><label><input id="voice" type="checkbox" checked> Include voice in export</label><label>Export format<select id="format"><option value="png">PNG sequence + WAV (Resolve fallback)</option><option value="mov">ProRes 4444 MOV</option></select></label><button id="export" disabled>Export transparent overlay</button><p>512 × 512 · 30 fps · Transparent<br>Position and resize in your video editor.</p><div id="status" role="status" aria-live="polite">Choose a recording to begin.</div></aside></div></main>`;
const $ = id => document.getElementById(id);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(512, 512); renderer.setPixelRatio(1); renderer.setClearColor(0, 0);
$('canvas').append(renderer.domElement);
const scene = new THREE.Scene(); const camera = new THREE.OrthographicCamera(-1.5, 1.5, 1.5, -1.5, 0.1, 10); camera.position.z = 5;
const mouth = createMouth(); scene.add(mouth.group);
const audio = new Audio(); let session = null; let busy = false; let audioUrl;
function draw(time) { mouth.update(poseAt(session?.cues || [], time)); renderer.render(scene, camera); }
function status(text) { $('status').textContent = text; }
function controls() {
  $('file').disabled = $('language').disabled = busy;
  $('analyze').disabled = busy || !$('file').files.length;
  $('play').disabled = $('seek').disabled = $('export').disabled = busy || !session;
  $('voice').disabled = $('format').disabled = busy;
}
async function request(url, options) {
  let res; try { res = await fetch(url, options); } catch { throw new Error('Cannot reach the export server. Start npm run dev and try again.'); }
  if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Request failed'); } return res;
}
function invalidate() { audio.pause(); audio.removeAttribute('src'); audio.load(); session = null; if (audioUrl) URL.revokeObjectURL(audioUrl); $('seek').value = 0; draw(0); controls(); }
$('file').onchange = () => { invalidate(); $('filename').textContent = $('file').files[0]?.name || 'Up to 120 seconds · 30 MB'; status('Click Create lip sync to analyze the recording.'); };
$('language').onchange = () => { invalidate(); status('Language changed. Create lip sync again.'); };
$('analyze').onclick = async () => {
  busy = true; audio.pause(); controls(); status('Analyzing speech locally with Rhubarb…');
  try {
    const file = $('file').files[0]; if (file.size > 30 * 1024 * 1024) throw new Error('Please choose a file under 30 MB.');
    session = await (await request(`${API}/analyze`, { method: 'POST', headers: { 'X-Speech-Language': $('language').value }, body: file })).json();
    const blob = await (await request(`${API}/${session.id}/audio`)).blob();
    if (audioUrl) URL.revokeObjectURL(audioUrl); audioUrl = URL.createObjectURL(blob); audio.src = audioUrl;
    $('seek').max = session.duration; $('seek').value = 0;
    status('Ready. Play or scrub to review the mouth shapes.');
  } catch (e) { session = null; status(e.message); } finally { busy = false; controls(); }
};
$('play').onclick = async () => { if (audio.paused) { if (audio.ended) audio.currentTime = 0; try { await audio.play(); } catch(e) { status(e.message); } } else audio.pause(); };
$('seek').oninput = () => { audio.currentTime = Number($('seek').value); draw(audio.currentTime); };
$('export').onclick = async () => {
  busy = true; audio.pause(); controls(); const savedTime = audio.currentTime;
  try {
    await request(`${API}/${session.id}/reset`, { method: 'POST' });
    const count = Math.ceil(session.duration * 30);
    for (let i = 0; i < count; i++) {
      draw(i / 30);
      const png = await new Promise(resolve => renderer.domElement.toBlob(resolve, 'image/png'));
      await request(`${API}/${session.id}/frame?index=${i}`, { method: 'POST', body: png });
      status(`Rendering transparent frames… ${Math.round((i + 1) / count * 100)}%`);
    }
    const format = $('format').value;
    status(format === 'png' ? 'Packaging transparent PNG sequence…' : 'Encoding ProRes MOV…');
    const blob = await (await request(`${API}/${session.id}/export?format=${format}&voice=${$('voice').checked ? 1 : 0}`, { method: 'POST' })).blob();
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = format === 'png' ? 'talking-mouth-png.zip' : 'talking-mouth.mov'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
    status(format === 'png' ? 'Export complete. Extract the ZIP and import the PNGs as a 30 fps image sequence. Import voice.wav separately. Instructions included.' : 'Export complete. Downloaded MOV; a copy is also saved in exports/.');
  } catch(e) { status(e.message); } finally { busy = false; draw(savedTime); controls(); }
};
function tick() { if (!busy) { draw(audio.currentTime || 0); $('seek').value = audio.currentTime || 0; $('time').textContent = `${(audio.currentTime || 0).toFixed(2)} / ${(session?.duration || 0).toFixed(2)} s`; $('play').textContent = audio.paused ? 'Play' : 'Pause'; } requestAnimationFrame(tick); } tick();
