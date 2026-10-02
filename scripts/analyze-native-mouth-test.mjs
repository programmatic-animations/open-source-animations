import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

const directory = path.resolve('public/audio/native-mouth-test');
const generated = path.join(directory, 'generated');
const platform = { darwin: 'macOS', linux: 'Linux', win32: 'Windows' }[process.platform];
const rhubarb = process.env.RHUBARB_PATH || path.resolve(`.tools/Rhubarb-Lip-Sync-1.14.0-${platform}/rhubarb${process.platform === 'win32' ? '.exe' : ''}`);
const lines = [
  { id: 'balu-question', character: 'balu', speaker: 'Balu', source: 'How to get a gf.m4a', text: 'Bro, how to get a girlfriend bro?' },
  { id: 'rabbit-advice', character: 'rabbit', speaker: 'Rabbit', source: 'Best way.mp3', text: 'Brother, best way to get a girlfriend is to be yourself.' }
];
function run(binary, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args); let diagnostic = '';
    child.stderr.on('data', b => { diagnostic = (diagnostic + b).slice(-2000); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(diagnostic)));
  });
}
// Read the decoded sample count, rather than rounded recognition/MP3 metadata.
function wavDuration(buffer) {
  let rate, align, bytes;
  for (let at = 12; at + 8 <= buffer.length;) {
    const name = buffer.toString('ascii', at, at + 4), size = buffer.readUInt32LE(at + 4);
    if (name === 'fmt ') { rate = buffer.readUInt32LE(at + 12); align = buffer.readUInt16LE(at + 20); }
    if (name === 'data') { bytes = size; break; }
    at += 8 + size + (size % 2);
  }
  if (!rate || !align || !bytes) throw new Error('Invalid decoded WAV');
  return bytes / align / rate;
}
function speechBounds(buffer, duration) {
  let at = 12, data;
  while (at + 8 < buffer.length) {
    const name = buffer.toString('ascii', at, at + 4), size = buffer.readUInt32LE(at + 4);
    if (name === 'data') { data = buffer.subarray(at + 8, at + 8 + size); break; }
    at += 8 + size + size % 2;
  }
  const levels = [], samples = data.length / 2, step = 960;
  for (let start = 0; start < samples; start += step) {
    let power = 0, count = 0;
    for (let sample = start; sample < Math.min(samples, start + step); sample++) { power += (data.readInt16LE(sample * 2) / 32768) ** 2; count++; }
    levels.push(Math.sqrt(power / count));
  }
  const threshold = Math.max(.003, Math.max(...levels) * .035), sustained = [];
  for (let i = 0; i + 2 < levels.length; i++) if (levels.slice(i, i + 3).every(level => level > threshold)) sustained.push(i);
  if (!sustained.length) return { start: 0, end: duration };
  // Only gate the outer recording handles, keeping quiet consonants inside the
  // performance. 80ms padding retains anticipatory closures and final sounds.
  return { start: Math.max(0, sustained[0] * .02 - .08), end: Math.min(duration, (sustained.at(-1) + 3) * .02 + .08) };
}
await fs.mkdir(generated, { recursive: true });
let nextStart = .6;
for (const line of lines) {
  const input = path.join(directory, line.source), voice = path.join(generated, `${line.id}.wav`);
  const analysis = path.join(generated, `${line.id}-analysis.wav`), transcript = path.join(generated, `${line.id}.txt`);
  await fs.writeFile(transcript, line.text);
  await run(ffmpeg, ['-y', '-i', input, '-vn', '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', voice]);
  await run(ffmpeg, ['-y', '-i', voice, '-ar', '16000', analysis]);
  const json = path.join(generated, `${line.id}.json`);
  await run(rhubarb, ['-f', 'json', '--extendedShapes', 'GHX', '-d', transcript, '-o', json, analysis]);
  const result = JSON.parse(await fs.readFile(json, 'utf8'));
  const decoded = await fs.readFile(voice);
  line.duration = wavDuration(decoded);
  line.sha256 = createHash('sha256').update(await fs.readFile(input)).digest('hex');
  line.audio = `/audio/native-mouth-test/generated/${line.id}.wav`;
  line.speechBounds = speechBounds(decoded, line.duration);
  line.cues = [
    ...(line.speechBounds.start > 0 ? [{ start: 0, end: line.speechBounds.start, value: 'X' }] : []),
    ...result.mouthCues.filter(cue => cue.end > line.speechBounds.start && cue.start < line.speechBounds.end).map(cue => ({ ...cue, start: Math.max(cue.start, line.speechBounds.start), end: Math.min(cue.end, line.speechBounds.end) })),
    ...(line.speechBounds.end < line.duration ? [{ start: line.speechBounds.end, end: line.duration, value: 'X' }] : [])
  ];
  line.start = Math.round(nextStart * 48000) / 48000;
  nextStart = line.start + line.duration + .6;
  await fs.rm(analysis);
  console.log(`${line.speaker}: ${line.duration.toFixed(3)}s, ${line.cues.length} cues`);
}
const duration = nextStart + .4;
const manifest = { version: 1, sampleRate: 48000, duration, lines };
await fs.writeFile(path.join(generated, 'dialogue.json'), JSON.stringify(manifest, null, 2) + '\n');
// Durable, sample-aligned dialogue stem also used for the MP4 review.
await run(ffmpeg, [
  '-y', ...lines.flatMap(line => ['-i', path.join(generated, `${line.id}.wav`)]),
  '-filter_complex', lines.map((line, i) => `[${i}:a]adelay=${Math.round(line.start * 48000)}S:all=1[a${i}]`).join(';') +
    ';[a0][a1]amix=inputs=2:normalize=0,apad[mix]',
  '-map', '[mix]', '-t', String(duration), '-ar', '48000', '-c:a', 'pcm_s16le', path.join(generated, 'dialogue.wav')
]);
console.log(`Native-mouth test: ${duration.toFixed(3)}s`);
