import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

const sessions = new Map(), root = path.resolve('.export-temp/native-mouth-test');
const manifestFile = path.resolve('public/audio/native-mouth-test/generated/dialogue.json');
async function body(req, limit = 1024) {
  const chunks = []; let bytes = 0;
  for await (const chunk of req) { bytes += chunk.length; if (bytes > limit) throw new Error('Request too large'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
export async function nativeMouthExportRoute(req, res) {
  if (!req.url.startsWith('/native-mouth-test/')) return false;
  const json = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
  if (req.headers.origin && !['http://localhost:5173','http://127.0.0.1:5173'].includes(req.headers.origin)) { json({ error: 'Origin not allowed' }, 403); return true; }
  try {
    if (req.method !== 'POST') throw new Error('Use POST');
    if (req.url === '/native-mouth-test/start') {
      const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8'));
      if (!(manifest.duration > 0 && manifest.duration < 30)) throw new Error('Test duration must be under 30 seconds');
      const id = randomUUID(), dir = path.join(root, id); await fs.mkdir(dir, { recursive: true });
      // Capture the exact stem alongside the duration at export start.
      await fs.copyFile(path.join(path.dirname(manifestFile), 'dialogue.wav'), path.join(dir, 'dialogue.wav'));
      const session = { dir, duration: manifest.duration, count: Math.ceil(manifest.duration * 60), next: 0, busy: false };
      sessions.set(id, session);
      const timer = setTimeout(async () => { if (!session.busy) { sessions.delete(id); await fs.rm(dir, { recursive: true, force: true }); } }, 1200000); timer.unref();
      json({ id, frames: session.count, duration: manifest.duration, fingerprint: manifest.lines.map(line => line.sha256).join(':') }); return true;
    }
    const match = req.url.match(/^\/native-mouth-test\/([a-f0-9-]+)\/(frame|finish)(?:\?index=(\d+))?$/);
    const session = match && sessions.get(match[1]);
    if (!session || session.busy) throw new Error('Export missing or busy');
    if (match[2] === 'frame') {
      const index = Number(match[3]);
      if (index !== session.next || index >= session.count) throw new Error('Unexpected frame');
      const png = await body(req, 8 * 1024 * 1024);
      if (png.length < 24 || png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || png.readUInt32BE(16) !== 1920 || png.readUInt32BE(20) !== 1080) throw new Error('Expected 1920×1080 PNG');
      await fs.writeFile(path.join(session.dir, `frame-${String(index).padStart(5,'0')}.png`), png); session.next++; json({ ok: true });
    } else {
      if (session.next !== session.count) throw new Error('Frames missing');
      session.busy = true;
      try {
        const destination = path.resolve('exports/native-mouth-test'); await fs.mkdir(destination, { recursive: true });
        const output = path.join(destination, 'native-mouth-test-v2.mp4');
        await new Promise((resolve, reject) => {
          const child = spawn(ffmpeg, ['-y','-framerate','60','-i',path.join(session.dir,'frame-%05d.png'),'-i',path.join(session.dir,'dialogue.wav'),'-t',String(session.duration),'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',output]);
          let diagnostic = ''; child.stderr.on('data', b => { diagnostic = (diagnostic + b).slice(-2000); });
          child.on('error', reject); child.on('close', code => code === 0 ? resolve() : reject(new Error(diagnostic)));
        });
        const qa = path.join(destination, 'qa-v2'); await fs.mkdir(qa, { recursive: true });
        for (const index of [72, 126, 216, 384, 432, 516]) if (index < session.count) await fs.copyFile(path.join(session.dir,`frame-${String(index).padStart(5,'0')}.png`),path.join(qa,`frame-${index}.png`));
        await fs.copyFile(path.join(session.dir,'dialogue.wav'),path.join(destination,'dialogue.wav'));
        sessions.delete(match[1]); await fs.rm(session.dir, { recursive: true, force: true });
        json({ file: output });
      } finally { session.busy = false; }
    }
  } catch (error) { json({ error: error.message }, 400); }
  return true;
}
