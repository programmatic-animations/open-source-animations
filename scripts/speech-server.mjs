import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
const root = path.resolve('.export-temp/speech');
const sessions = new Map();
const platform = { darwin: 'macOS', linux: 'Linux', win32: 'Windows' }[process.platform];
const rhubarb = process.env.RHUBARB_PATH || path.resolve(`.tools/Rhubarb-Lip-Sync-1.14.0-${platform}/rhubarb${process.platform === 'win32' ? '.exe' : ''}`);
export function run(binary, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args); let log = '';
    child.stderr.on('data', b => { log = (log + b).slice(-2000); });
    const timer = setTimeout(() => child.kill('SIGKILL'), 180000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(log || `Process exited ${code}`)); });
  });
}
async function body(req, limit) {
  const chunks = []; let bytes = 0;
  for await (const chunk of req) { bytes += chunk.length; if (bytes > limit) throw new Error('Upload exceeds size limit'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
export async function speechRoute(req, res) {
  if (!req.url.startsWith('/speech/')) return false;
  const json = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
  // Only our preview may invoke these local processing endpoints from a browser.
  if (req.headers.origin && !['http://localhost:5173', 'http://127.0.0.1:5173'].includes(req.headers.origin)) { json({ error: 'Origin not allowed' }, 403); return true; }
  try {
    if (req.method === 'POST' && req.url === '/speech/analyze') {
      await fs.access(rhubarb).catch(() => { throw new Error('Rhubarb missing. See README Mouth Studio setup or set RHUBARB_PATH.'); });
      const upload = await body(req, 30 * 1024 * 1024);
      const id = randomUUID(); const dir = path.join(root, id); await fs.mkdir(dir, { recursive: true });
      try {
        await fs.writeFile(path.join(dir, 'input'), upload);
        await run(ffmpeg, ['-y', '-i', path.join(dir, 'input'), '-t', '121', '-vn', '-ar', '48000', '-c:a', 'pcm_s16le', path.join(dir, 'voice.wav')]);
        await run(ffmpeg, ['-y', '-i', path.join(dir, 'voice.wav'), '-ac', '1', '-ar', '16000', path.join(dir, 'analysis.wav')]);
        await run(rhubarb, ['-f', 'json', '--extendedShapes', 'GHX', '-r', req.headers['x-speech-language'] === 'other' ? 'phonetic' : 'pocketSphinx', '-o', path.join(dir, 'cues.json'), path.join(dir, 'analysis.wav')]);
        const data = JSON.parse(await fs.readFile(path.join(dir, 'cues.json'), 'utf8'));
        if (!(data.metadata.duration > 0) || data.metadata.duration > 120) throw new Error('Use a recording between 0 and 120 seconds.');
        sessions.set(id, { dir, duration: data.metadata.duration, next: 0, busy: false });
        const timer = setTimeout(async () => { const s = sessions.get(id); if (s && !s.busy) { sessions.delete(id); await fs.rm(dir, { recursive: true, force: true }); } }, 3600000); timer.unref();
        json({ id, duration: data.metadata.duration, cues: data.mouthCues });
      } catch (error) { await fs.rm(dir, { recursive: true, force: true }); throw error; }
      return true;
    }
    const match = req.url.match(/^\/speech\/([a-f0-9-]+)\/(audio|reset|frame|export)(?:\?(.+))?$/);
    if (!match || !sessions.has(match[1])) throw new Error('Session expired. Upload the recording again.');
    const s = sessions.get(match[1]); const action = match[2];
    if (req.method === 'GET' && action === 'audio') {
      res.writeHead(200, { 'Content-Type': 'audio/wav' }); res.end(await fs.readFile(path.join(s.dir, 'voice.wav')));
    } else if (req.method === 'POST' && action === 'reset') {
      if (s.busy) throw new Error('Export already running');
      s.next = 0; json({ ok: true });
    } else if (req.method === 'POST' && action === 'frame') {
      if (s.busy) throw new Error('Export already running');
      const index = Number(new URLSearchParams(match[3]).get('index'));
      if (index !== s.next || index >= Math.ceil(s.duration * 30)) throw new Error('Unexpected frame index');
      const png = await body(req, 2 * 1024 * 1024);
      if (png.length < 24 || png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || png.readUInt32BE(16) !== 512 || png.readUInt32BE(20) !== 512) throw new Error('Expected a 512×512 PNG');
      await fs.writeFile(path.join(s.dir, `frame-${String(index).padStart(5, '0')}.png`), png); s.next++; json({ ok: true });
    } else if (req.method === 'POST' && action === 'export') {
      if (s.busy || s.next !== Math.ceil(s.duration * 30)) throw new Error('Missing frames or export already running');
      s.busy = true;
      try {
        const includeVoice = new URLSearchParams(match[3]).get('voice') !== '0';
        if (new URLSearchParams(match[3]).get('format') === 'png') {
          const packageDir = path.join(s.dir, 'png-package');
          await fs.mkdir(packageDir, { recursive: true });
          for (let i = 0; i < s.next; i++) {
            const name = `frame-${String(i).padStart(5, '0')}.png`;
            await fs.copyFile(path.join(s.dir, name), path.join(packageDir, name));
          }
          if (includeVoice) await fs.copyFile(path.join(s.dir, 'voice.wav'), path.join(packageDir, 'voice.wav'));
          else await fs.rm(path.join(packageDir, 'voice.wav'), { force: true });
          await fs.writeFile(path.join(packageDir, 'README.txt'), 'DaVinci Resolve: Extract this ZIP. In Media page > Media Storage, disable Show Individual Frames in the three-dot menu. Import frame-[00000-...].png as one image sequence. Set Clip Attributes > Video Frame Rate to 30 and Alpha Mode to Straight. Place above your main video. Import voice.wav separately if included, aligned to the first frame. Frames are 512x512 RGBA PNGs.');
          const output = path.resolve('exports', `talking-mouth-${match[1]}-png.zip`);
          await fs.rm(output, { force: true });
          await run('python3', ['-m', 'zipfile', '-c', output, packageDir]);
          res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="talking-mouth-png.zip"' });
          res.end(await fs.readFile(output));
          return true;
        }

        const output = path.resolve('exports', `talking-mouth-${match[1]}.mov`);
        await run(ffmpeg, ['-y', '-framerate', '30', '-i', path.join(s.dir, 'frame-%05d.png'), ...(includeVoice ? ['-i', path.join(s.dir, 'voice.wav')] : []), '-t', String(s.duration), '-c:v', 'prores_ks', '-profile:v', '4', '-pix_fmt', 'yuva444p10le', ...(includeVoice ? ['-c:a', 'pcm_s16le'] : ['-an']), output]);
        res.writeHead(200, { 'Content-Type': 'video/quicktime', 'Content-Disposition': 'attachment; filename="talking-mouth.mov"' }); res.end(await fs.readFile(output));
      } finally { s.busy = false; }
    } else throw new Error('Unsupported request');
  } catch (error) { json({ error: error.message }, 400); }
  return true;
}
