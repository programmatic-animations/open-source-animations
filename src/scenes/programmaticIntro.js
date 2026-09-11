import * as THREE from 'three';

export const SCENE_CONFIG = {
  id: 'programmatic-animations-intro',
  title: 'Programmatic Animations Intro'
};

/* ---------------- Easing & Math Helpers ---------------- */
function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

function smoothstep(min, max, value) {
  const x = clamp01((value - min) / (max - min));
  return x * x * (3 - 2 * x);
}

function elasticOut(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const p = 0.35;
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
}

/* ---------------- Texture Generators ---------------- */
function createTitleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Micro-telemetry header
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
  ctx.font = '600 28px "Courier New", monospace';
  ctx.letterSpacing = '8px';
//   ctx.fillText('', canvas.width / 2, 230);

  // Outer Decorative Corner Brackets
  ctx.strokeStyle = 'rgba(0, 230, 255, 0.6)';
  ctx.lineWidth = 4;
  const bx = 260, by = 250, bw = 1528, bh = 460;
  const cl = 40;
  // Top-left
  ctx.beginPath(); ctx.moveTo(bx, by + cl); ctx.lineTo(bx, by); ctx.lineTo(bx + cl, by); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cl); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(bx, by + bh - cl); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cl, by + bh); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(bx + bw - cl, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cl); ctx.stroke();

  // Glow Layer 1 - Wide cyan bleed
  ctx.shadowColor = 'rgba(0, 220, 255, 0.85)';
  ctx.shadowBlur = 45;
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 184px "Arial Black", "Montserrat", sans-serif';
  ctx.fillText('PROGRAMMATIC', canvas.width / 2, 430);

  // Glow Layer 2 - Violet / Cyan secondary text
  ctx.shadowColor = 'rgba(150, 60, 255, 0.9)';
  ctx.shadowBlur = 35;
  ctx.fillStyle = '#d8f4ff';
  ctx.font = '900 148px "Arial Black", "Montserrat", sans-serif';
  ctx.fillText('ANIMATIONS', canvas.width / 2, 595);

  ctx.shadowBlur = 0;

  // Center division laser bar
  const grad = ctx.createLinearGradient(400, 0, 1648, 0);
  grad.addColorStop(0, 'rgba(0, 240, 255, 0)');
  grad.addColorStop(0.2, 'rgba(0, 240, 255, 0.9)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.8, 'rgba(180, 80, 255, 0.9)');
  grad.addColorStop(1, 'rgba(180, 80, 255, 0)');

  ctx.strokeStyle = grad;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(380, 665);
  ctx.lineTo(1668, 665);
  ctx.stroke();

  // Target crosshairs at bar center
  ctx.fillStyle = '#00ffff';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, 665, 7, 0, Math.PI * 2);
  ctx.fill();

  // Bottom subtitle badge
  ctx.fillStyle = 'rgba(160, 225, 255, 0.75)';
  ctx.font = '700 32px "Courier New", monospace';
  ctx.fillText('[ github.com/programmatic-animations ]', canvas.width / 2, 730);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createRadialGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(256, 256, 10, 256, 256, 250);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.18, 'rgba(0, 220, 255, 0.65)');
  gradient.addColorStop(0.48, 'rgba(100, 30, 255, 0.25)');
  gradient.addColorStop(1, 'rgba(0, 4, 16, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createShockwaveTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(256, 256, 170, 256, 256, 245);
  gradient.addColorStop(0, 'rgba(0, 240, 255, 0)');
  gradient.addColorStop(0.7, 'rgba(180, 240, 255, 0.85)');
  gradient.addColorStop(0.9, 'rgba(0, 220, 255, 1)');
  gradient.addColorStop(1, 'rgba(0, 10, 30, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createLightBeamTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(0, 240, 255, 0)');
  grad.addColorStop(0.4, 'rgba(0, 240, 255, 0.2)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.6, 'rgba(180, 80, 255, 0.2)');
  grad.addColorStop(1, 'rgba(180, 80, 255, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ---------------- 3D Procedural Mesh Builders ---------------- */
function createCyberRings() {
  const group = new THREE.Group();

  // Outer Segmented Ring
  const ringGeo1 = new THREE.RingGeometry(3.6, 3.65, 64);
  const ringMat1 = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending
  });
  const ring1 = new THREE.Mesh(ringGeo1, ringMat1);

  // Middle Dashed HUD Ring (Circle points)
  const ringGeo2 = new THREE.BufferGeometry();
  const pointCount = 96;
  const positions = new Float32Array(pointCount * 3);
  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * 4.2;
    positions[i * 3 + 1] = Math.sin(angle) * 4.2;
    positions[i * 3 + 2] = 0;
  }
  ringGeo2.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const ringPoints = new THREE.Points(
    ringGeo2,
    new THREE.PointsMaterial({
      color: 0x8be5ff,
      size: 0.055,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    })
  );

  // Gimbal Ellipse Ring
  const ringGeo3 = new THREE.TorusGeometry(3.1, 0.018, 16, 80);
  const ringMat3 = new THREE.MeshBasicMaterial({
    color: 0xb545ff,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending
  });
  const ring3 = new THREE.Mesh(ringGeo3, ringMat3);

  group.add(ring1);
  group.add(ringPoints);
  group.add(ring3);

  return { group, ring1, ringPoints, ring3 };
}

function createAudioWaveformLine() {
  const count = 90;
  const positions = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0,
    linewidth: 2,
    blending: THREE.AdditiveBlending
  });

  const line = new THREE.Line(geometry, material);
  return { line, count };
}

function createVortexParticles() {
  const count = 1600;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const meta = [];

  const colCyan = new THREE.Color(0x00f0ff);
  const colPurple = new THREE.Color(0xaf40ff);
  const colWhite = new THREE.Color(0xffffff);

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2.0 + Math.random() * 9.5;
    const z = (Math.random() - 0.5) * 8.0;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius;
    positions[i * 3 + 2] = z;

    // Mixed high-tech palette
    const roll = Math.random();
    const color = roll < 0.45 ? colCyan : roll < 0.85 ? colPurple : colWhite;
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    meta.push({
      baseAngle: angle,
      radius: radius,
      speed: (0.4 + Math.random() * 1.6) * (Math.random() > 0.5 ? 1 : -1),
      z: z,
      burstFactor: 1.0 + Math.random() * 2.5
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.055,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const points = new THREE.Points(geometry, material);
  return { points, meta, count };
}

function createPerspectiveFloor() {
  const gridHelper = new THREE.GridHelper(30, 36, 0x00f6ff, 0x162244);
  gridHelper.position.y = -3.2;
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.28;
  gridHelper.material.blending = THREE.AdditiveBlending;
  return gridHelper;
}

/* ---------------- Main Scene Factory ---------------- */
export function createProgrammaticIntroScene({ scene, camera }) {
  scene.background = new THREE.Color(0x02050e);

  // Camera initial framing
  camera.position.set(0, 1.8, 12.0);
  camera.lookAt(0, 0, 0);

  // 1. Perspective Horizon Floor
  const floorGrid = createPerspectiveFloor();
  scene.add(floorGrid);

  // 2. Converging Vortex Particles
  const { points: particleField, meta: particleMeta, count: particleCount } = createVortexParticles();
  scene.add(particleField);

  // 3. Central Radial Glow Orb
  const glowTexture = createRadialGlowTexture();
  const glowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  glowPlane.position.set(0, 0.1, -0.6);
  scene.add(glowPlane);

  // 4. Detonation Shockwave Ring
  const shockTexture = createShockwaveTexture();
  const shockwave = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: shockTexture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  shockwave.position.set(0, 0, -0.2);
  scene.add(shockwave);

  // 5. Holographic Cyber Rings
  const { group: ringsGroup, ring1, ringPoints, ring3 } = createCyberRings();
  ringsGroup.position.set(0, 0.05, -0.3);
  scene.add(ringsGroup);

  // 6. Audio Waveform Oscilloscope Line
  const { line: waveLine, count: waveCount } = createAudioWaveformLine();
  waveLine.position.set(0, -1.5, 0.05);
  scene.add(waveLine);

  // 7. High-Res Title Plane
  const titleTexture = createTitleTexture();
  const titleMaterial = new THREE.MeshBasicMaterial({
    map: titleTexture,
    transparent: true,
    opacity: 0
  });
  const titlePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(9.6, 4.8),
    titleMaterial
  );

  const titleGroup = new THREE.Group();
  titleGroup.add(titlePlane);
  titleGroup.position.set(0, 0.0, 0.0);
  titleGroup.scale.setScalar(0.01);
  scene.add(titleGroup);

  // 8. Additive Laser Light Beam Sweep
  const beamTexture = createLightBeamTexture();
  const lightBeam = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 4.8),
    new THREE.MeshBasicMaterial({
      map: beamTexture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  lightBeam.position.set(-6.5, 0, 0.08);
  titleGroup.add(lightBeam);

  // State
  const IMPACT_TIME = 1.05; // Moment of high-energy title ignition

  return {
    update(time) {
      /* --- Phase 0: Particle Vortex & Singularity Convergence (0.0 -> 1.05s) --- */
      const pPositions = particleField.geometry.attributes.position.array;
      const isPostImpact = time >= IMPACT_TIME;
      const burstProgress = clamp01((time - IMPACT_TIME) / 1.8);

      particleField.material.opacity = smoothstep(0.0, 0.4, time) * (1.0 - burstProgress * 0.45);

      for (let i = 0; i < particleCount; i++) {
        const p = particleMeta[i];
        let currentRad = p.radius;

        if (!isPostImpact) {
          // Vortex suck-in towards singularity
          const suckProgress = clamp01(time / IMPACT_TIME);
          currentRad = p.radius * (1.0 - Math.pow(suckProgress, 2.5) * 0.92);
        } else {
          // Explosive shockwave radial burst
          currentRad = (p.radius * 0.08) + burstProgress * p.burstFactor * 6.5;
        }

        const angle = p.baseAngle + time * p.speed;
        pPositions[i * 3] = Math.cos(angle) * currentRad;
        pPositions[i * 3 + 1] = Math.sin(angle) * currentRad;
        pPositions[i * 3 + 2] = p.z + Math.sin(time * 2.0 + i) * 0.2;
      }
      particleField.geometry.attributes.position.needsUpdate = true;

      /* --- Phase 1: Shockwave Detonation --- */
      if (isPostImpact) {
        const shockP = clamp01((time - IMPACT_TIME) / 1.15);
        const shockScale = Math.pow(shockP, 0.55) * 16.0;
        shockwave.scale.set(shockScale, shockScale, 1);
        shockwave.material.opacity = Math.max(0, (1.0 - shockP) * 0.95);
        shockwave.rotation.z = time * 0.3;
      }

      /* --- Phase 2: Title Reveal & Spring Snap --- */
      const titleRevealP = clamp01((time - (IMPACT_TIME - 0.15)) / 0.85);
      const titleScale = elasticOut(titleRevealP);
      titleGroup.scale.setScalar(0.01 + titleScale * 0.99);
      titleMaterial.opacity = smoothstep(0.0, 0.35, titleRevealP);

      // Radial background flare synchronicity
      const flareP = smoothstep(IMPACT_TIME - 0.15, IMPACT_TIME + 0.35, time);
      glowPlane.material.opacity = flareP * (0.8 + Math.sin(time * 4.0) * 0.1);
      glowPlane.scale.setScalar(0.7 + flareP * 0.4 + Math.sin(time * 2.0) * 0.05);

      /* --- Phase 3: Holographic Gimbal Rings --- */
      ringsGroup.rotation.z = time * 0.18;
      ring1.rotation.z = -time * 0.35;
      ring3.rotation.x = Math.PI * 0.35 + Math.sin(time * 0.8) * 0.25;
      ring3.rotation.y = time * 0.45;
      ringsGroup.scale.setScalar(0.65 + smoothstep(0.5, 1.8, time) * 0.38);

      /* --- Phase 4: Dynamic Oscilloscope Waveform --- */
      const wavePos = waveLine.geometry.attributes.position.array;
      const waveSpread = 7.2;
      const waveOpacity = smoothstep(IMPACT_TIME + 0.2, IMPACT_TIME + 0.8, time);
      waveLine.material.opacity = waveOpacity * 0.85;

      for (let i = 0; i < waveCount; i++) {
        const u = i / (waveCount - 1);
        const x = (u - 0.5) * waveSpread;
        // Window bell curve envelope to taper edges
        const envelope = Math.sin(u * Math.PI);
        const y = Math.sin(u * 18.0 - time * 6.5) * Math.cos(u * 6.0 + time * 3.0) * 0.22 * envelope;
        wavePos[i * 3] = x;
        wavePos[i * 3 + 1] = y;
        wavePos[i * 3 + 2] = 0;
      }
      waveLine.geometry.attributes.position.needsUpdate = true;

      /* --- Phase 5: Laser Light Beam Sweep --- */
      if (time > IMPACT_TIME + 0.5) {
        const sweepLoop = ((time - (IMPACT_TIME + 0.5)) % 3.0) / 3.0;
        lightBeam.material.opacity = Math.sin(sweepLoop * Math.PI) * 0.8;
        lightBeam.position.x = THREE.MathUtils.lerp(-5.8, 5.8, sweepLoop);
      }

      /* --- Phase 6: Continuous Floor Motion & Parallax Camera --- */
      floorGrid.position.z = (time * 1.5) % 1.0;

      // Camera boom movement from tilted dynamic angle to lock-in
      const camIntroP = smoothstep(0.0, 2.4, time);
      const targetCamZ = THREE.MathUtils.lerp(12.0, 8.8, camIntroP);
      const targetCamY = THREE.MathUtils.lerp(1.8, 0.05, camIntroP);

      // High-impact decaying screen shake
      let shakeX = 0;
      let shakeY = 0;
      if (time >= IMPACT_TIME && time < IMPACT_TIME + 0.6) {
        const shakeDecay = 1.0 - (time - IMPACT_TIME) / 0.6;
        const freq = 55.0;
        shakeX = Math.sin(time * freq) * 0.12 * Math.pow(shakeDecay, 2);
        shakeY = Math.cos(time * freq * 1.2) * 0.09 * Math.pow(shakeDecay, 2);
      }

      // Idle breathing roll
      const idleYaw = Math.sin(time * 0.4) * 0.04;
      const idlePitch = Math.cos(time * 0.5) * 0.03;

      camera.position.set(shakeX + idleYaw, targetCamY + shakeY + idlePitch, targetCamZ);
      camera.lookAt(0, 0, 0);
    }
  };
}