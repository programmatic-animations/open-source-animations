// Durations are local to each shot; starts and ends are derived in order.
export function defineShots(definitions) {
  let start = 0;
  const ids = new Set();
  if (!definitions.length) throw new Error('A scene needs at least one shot');
  return definitions.map(definition => {
    if (!definition.id || ids.has(definition.id)) throw new Error('Shot IDs must be unique');
    if (!(definition.duration > 0) || !Number.isFinite(definition.duration)) throw new Error('Shot duration must be finite and positive');
    ids.add(definition.id);
    const shot = Object.freeze({ ...definition, start, end: start + definition.duration });
    start = shot.end;
    return shot;
  });
}

export function getShotAt(shots, time) {
  const clamped = Math.max(0, Math.min(shots.at(-1).end, time));
  const shot = shots.find(entry => clamped < entry.end) ?? shots.at(-1);
  return { shot, time: clamped - shot.start, progress: (clamped - shot.start) / shot.duration };
}

export function updateShot(shots, sceneTime, context) {
  const active = getShotAt(shots, sceneTime);
  active.shot.update?.({ ...context, shotTime: active.time, progress: active.progress });
  return active;
}
