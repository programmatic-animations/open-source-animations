// Bake the legacy stateful take once, in order, then seek without touching its
// closure state. Parent changes are stored alongside local transforms.
export function bakeLegacy(scene, update, end = 18.5, fps = 60) {
  const objects = []; scene.traverse(o => { if (o !== scene) objects.push(o); });
  const indices = new Map(objects.map((o, i) => [o, i]));
  const stride = 13, frames = [];
  for (let f = 0; f <= Math.ceil(end * fps); f++) {
    update(f / fps); scene.updateMatrixWorld(true);
    const data = new Float32Array(objects.length * stride);
    objects.forEach((o, i) => {
      data.set([...o.position, ...o.quaternion, ...o.scale, o.visible ? 1 : 0, indices.get(o.parent) ?? -1, o.material?.opacity ?? 1], i * stride);
    });
    frames.push(data);
  }
  return time => {
    const frame = Math.max(0, Math.min(frames.length - 1, time * fps));
    const a = frames[Math.floor(frame)], b = frames[Math.min(frames.length - 1, Math.floor(frame) + 1)], p = frame % 1;
    objects.forEach((o, i) => {
      const k = i * stride, parent = a[k + 11] < 0 ? scene : objects[a[k + 11]];
      if (o.parent !== parent) parent.add(o);
      // Never interpolate local coordinates across a reparenting event.
      const blend = a[k + 11] === b[k + 11] ? p : 0;
      const v = j => a[k + j] + (b[k + j] - a[k + j]) * blend;
      o.position.set(v(0), v(1), v(2));
      o.quaternion.set(v(3), v(4), v(5), v(6)).normalize();
      o.scale.set(v(7), v(8), v(9)); o.visible = Boolean(a[k + 10]);
      if (o.material) o.material.opacity = v(12);
    });
    scene.updateMatrixWorld(true);
  };
}
