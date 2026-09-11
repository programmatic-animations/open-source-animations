import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const PORT = 5174;

const EXPORT_DIR = path.resolve('exports');
const TEMP_DIR = path.resolve('.export-temp');

await fs.mkdir(EXPORT_DIR, { recursive: true });
await fs.mkdir(TEMP_DIR, { recursive: true });

function safeName(value) {
  return String(value || 'scene')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function convertToMp4(input, output) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, [
      '-y',
    
      '-i', input,
    
      // Force a stable constant 60 FPS output.
      '-vf', 'fps=60',
    
      '-c:v', 'libx264',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
    
      '-an',
    
      output
    ]);

    ffmpeg.on('error', reject);

    ffmpeg.on('close', (code) => {
      code === 0
        ? resolve()
        : reject(new Error(`FFmpeg exited with ${code}`));
    });
  });
}

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Scene-Id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }

  if (req.method === 'POST' && req.url === '/export') {
    try {
      const chunks = [];

      for await (const chunk of req) {
        chunks.push(chunk);
      }

      const id = safeName(req.headers['x-scene-id']);
      const temp = path.join(TEMP_DIR, `${id}.webm`);
      const output = path.join(EXPORT_DIR, `${id}.mp4`);

      await fs.writeFile(temp, Buffer.concat(chunks));
      await convertToMp4(temp, output);
      await fs.unlink(temp).catch(() => {});

      res.writeHead(200, { 'Content-Type': 'application/json' });

      return res.end(JSON.stringify({
        ok: true,
        file: `exports/${id}.mp4`
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });

      return res.end(JSON.stringify({
        ok: false,
        error: error.message
      }));
    }
  }

  res.writeHead(404);
  res.end();
}).listen(PORT, () => {
  console.log(`Export server: http://localhost:${PORT}`);
});
