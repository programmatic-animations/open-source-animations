import * as THREE from 'three';

import { createBear } from '../characters/bear.js';
import { createBackdrop } from '../environment/backdrop.js';
import { createTree } from '../props/tree.js';
import { createHoneycomb } from '../props/honeycomb.js';
import { createBees } from '../props/bees.js';
import { createRabbit } from '../characters/rabbit.js';

export const SCENE_CONFIG = {
  id: 'pit-rabbits',
  title: 'Pit Rabbits'
};

export function createPitRabbitsScene({ scene, camera }) {
  // --------------------------------------------------
  // BACKGROUND / EXTERIOR DAYLIGHT
  // --------------------------------------------------

  scene.background = new THREE.Color(0x9fd6ff);

  const backdrop = createBackdrop({
    position: { x: 0, y: 4.5, z: -8 }
  });

  scene.add(backdrop);

  // --------------------------------------------------
  // CAMERA
  //
  // Inside the pit looking upward.
  // Deliberately shallow enough that future rabbit
  // faces around the rim will remain large/readable.
  // --------------------------------------------------

  camera.position.set(1.05, -1.32, 1.15);

  camera.fov = 105;
  camera.updateProjectionMatrix();

  camera.lookAt(0, 1.62, 0);

  // --------------------------------------------------
  // LIGHTING
  //
  // Exterior is bright while the contents of the pit
  // remain much darker.
  // --------------------------------------------------

  const daylight = new THREE.DirectionalLight(
    0xffffff,
    2.6
  );

  daylight.position.set(3, 8, 4);
  scene.add(daylight);

  const exteriorAmbient = new THREE.AmbientLight(
    0xffffff,
    0.38
  );

  scene.add(exteriorAmbient);

  // --------------------------------------------------
  // PIT
  //
  // Shot-specific geometry.
  //
  // Camera sits inside this cylinder.
  // We render the inside faces using BackSide.
  // --------------------------------------------------

  const pitGroup = new THREE.Group();

  const pitWallMaterial = new THREE.MeshStandardMaterial({
    color: 0x120d0a,
    roughness: 1,
    side: THREE.BackSide
  });

  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(
      3.25,
      2.75,
      3.2,
      48,
      1,
      true
    ),
    pitWallMaterial
  );

  pitWall.position.y = 0;
  pitGroup.add(pitWall);

  // Dark floor at the bottom of the pit.
  const pitFloor = new THREE.Mesh(
    new THREE.CircleGeometry(2.75, 48),
    new THREE.MeshStandardMaterial({
      color: 0x070606,
      roughness: 1,
      side: THREE.DoubleSide
    })
  );

  pitFloor.rotation.x = -Math.PI / 2;
  pitFloor.position.y = -1.58;

  pitGroup.add(pitFloor);

  scene.add(pitGroup);

  // --------------------------------------------------
  // BRIGHT GROUND AROUND THE OPENING
  //
  // Large ring viewed from underneath.
  // The center remains open so we can see the sky.
  // --------------------------------------------------

  const rim = new THREE.Mesh(
    new THREE.RingGeometry(
      3.05,
      8,
      64
    ),
    new THREE.MeshStandardMaterial({
      color: 0x4f8a3a,
      roughness: 1,
      side: THREE.DoubleSide
    })
  );

  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 1.62;

  scene.add(rim);

  function tintMeshes(root, color) {
    root.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
  
      if (Array.isArray(obj.material)) {
        obj.material = obj.material.map((mat) => {
          const clone = mat.clone();
          if (clone.color) clone.color.set(color);
          return clone;
        });
      } else {
        obj.material = obj.material.clone();
        if (obj.material.color) obj.material.color.set(color);
      }
    });
  }

  // --------------------------------------------------
  // BEAR
  //
  // Scene begins after the fall.
  // --------------------------------------------------

  const {
    bear,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg
  } = createBear();

  bear.position.set(-0.35, -1.42, 0.25);

  // Bear is sprawled after the fall.
  bear.rotation.order = 'YXZ';
  bear.rotation.x = -Math.PI / 2;
  bear.rotation.y = -0.25;
  bear.rotation.z = -0.15;

  bear.scale.setScalar(0.9);

  leftArm.rotation.x = -0.4;
  rightArm.rotation.x = 0.25;

  leftLeg.rotation.x = 0.2;
  rightLeg.rotation.x = -0.3;

  headGroup.rotation.x = 0.12;

  scene.add(bear);

  tintMeshes(bear, 0x444444);


  // --------------------------------------------------
  // BROKEN BRANCH + HONEYCOMB
  //
  // Reuse the existing tree/branch construction but
  // keep only the branch assembly for this shot.
  // --------------------------------------------------

  const honeycomb = createHoneycomb();

  const {
    tree,
    branchPivot
  } = createTree({ honeycomb });

  // Temporarily add tree so world matrices are valid.
  scene.add(tree);
  scene.updateMatrixWorld(true);

  // Preserve the branch assembly while separating it
  // from the rest of the tree.
  scene.attach(branchPivot);

  scene.remove(tree);

  branchPivot.position.set(
    1.45,
    -1.5,
    -0.30
  );
  
  branchPivot.rotation.set(
    0.12,
    0.50,
    1.02
  );
  
  branchPivot.scale.setScalar(0.92);

  tintMeshes(branchPivot, 0x3b3b3b);
  tintMeshes(honeycomb, 0x606060);

  // --------------------------------------------------
  // RABBITS
  // --------------------------------------------------

  function createPeekingRabbit({
    color,
    bellyColor,
    position,
    headRotationX = 0.9,
    revealDelay = 0,
    blinkOffsets = [],
    laughPhase = 0
  }) {
    const {
      rabbit,
      body,
      headGroup,
      jaw,
      mouth,
      teethGroup,
      leftEye,
      rightEye,
      leftEyeLine,
      rightEyeLine
    } = createRabbit({
      color,
      bellyColor
    });
  
    // Only the face/head should ever be visible.
    body.visible = false;
  
    // Keep the tested face proportions.
    headGroup.scale.setScalar(1.5);
    rabbit.scale.setScalar(1);
  
    // Keep the tested head tilt.
    headGroup.rotation.x = headRotationX;
  
    const shownY = position[1];
    const hiddenY = shownY - 0.55;
  
    // Start just below the visible position.
    rabbit.position.set(
      position[0],
      hiddenY,
      position[2]
    );
  
    // Face toward the pit center.
    rabbit.lookAt(0, shownY, 0);
  
    // Keep hidden until reveal starts.
    rabbit.visible = false;
  
    scene.add(rabbit);
  
    return {
      rabbit,
      headGroup,
      jaw,
      mouth,
      teethGroup,
      leftEye,
      rightEye,
      leftEyeLine,
      rightEyeLine,
      revealDelay,
      shownY,
      hiddenY,
      blinkOffsets,
      laughPhase
    };
  }

  function setRabbitBlinkState(entry, closed) {
    entry.leftEye.visible = !closed;
    entry.rightEye.visible = !closed;
    entry.leftEyeLine.visible = closed;
    entry.rightEyeLine.visible = closed;
  }
  
  const laughStartTime = 6.35;

  const rabbits = [
    createPeekingRabbit({
      color: 0xb8a18a,
      bellyColor: 0xd8cbbb,
      position: [-1.0, 1.2, -3.25],
      revealDelay: 4.0,
      blinkOffsets: [0.55, 1.0],
      laughPhase: 0.0
    }),
  
    createPeekingRabbit({
      color: 0xd8d8d8,
      bellyColor: 0xf0eeee,
      position: [1.05, 1.2, -3.25],
      revealDelay: 4.45,
      blinkOffsets: [0.5],
      laughPhase: 0.7
    }),
  
    createPeekingRabbit({
      color: 0x8c8c8c,
      bellyColor: 0xcacaca,
      position: [-2.15, 1.45, -2.55],
      revealDelay: 4.9,
      blinkOffsets: [0.35, 0.9],
      laughPhase: 1.4
    }),
  
    createPeekingRabbit({
      color: 0x8b684d,
      bellyColor: 0xc9ad92,
      position: [2.1, 1.45, -2.55],
      revealDelay: 5.35,
      blinkOffsets: [0.6],
      laughPhase: 2.1
    })
  ];

  // --------------------------------------------------
  // BEES
  //
  // Reuse the same bee models, but Scene 2 begins with
  // them already free above the pit.
  // --------------------------------------------------

  const bees = createBees({ honeycomb });

  bees.forEach((bee, i) => {
    scene.attach(bee);

    bee.position.set(
      i === 0 ? -0.8 : 0.9,
      2.05 + i * 0.15,
      i === 0 ? 0.2 : -0.15
    );
  });

  // --------------------------------------------------
  // UPDATE
  //
  // Only bees animate for now.
  // Rabbits come in the next step.
  // --------------------------------------------------

  function update(time) {
    // --------------------------------------------------
    // BEAR: fallen -> sit up -> look upward
    // --------------------------------------------------

    // Wait briefly before moving.
    const sitProgress = THREE.MathUtils.clamp(
      (time - 1.0) / 1.6,
      0,
      1
    );

    const sitEase =
      sitProgress * sitProgress * (3 - 2 * sitProgress);

    // Rise from the fallen position into a seated pose.
    bear.position.x = THREE.MathUtils.lerp(
      -0.8,
      -2,
      sitEase
    );
    
    bear.position.y = THREE.MathUtils.lerp(
      -1.42,
      -1.58,
      sitEase
    );
    
    bear.position.z = THREE.MathUtils.lerp(
      0.25,
      0.8,
      sitEase
    );
    
    // Upright torso
    bear.rotation.x = THREE.MathUtils.lerp(
      -Math.PI / 2,
      0,
      sitEase
    );
    
    // Turn completely away from camera
    bear.rotation.y = THREE.MathUtils.lerp(
      -0.25,
      Math.PI,
      sitEase
    );
    
    bear.rotation.z = THREE.MathUtils.lerp(
      -0.15,
      0,
      sitEase
    );

    leftArm.rotation.x = THREE.MathUtils.lerp(
      -0.4,
      -0.15,
      sitEase
    );

    rightArm.rotation.x = THREE.MathUtils.lerp(
      0.25,
      -0.05,
      sitEase
    );

    leftLeg.rotation.x = THREE.MathUtils.lerp(
      0.2,
      Math.PI / 2,
      sitEase
    );
    
    rightLeg.rotation.x = THREE.MathUtils.lerp(
      -0.3,
      Math.PI / 2,
      sitEase
    );

    // Only after sitting up, look toward the pit opening.
    const lookProgress = THREE.MathUtils.clamp(
      (time - 2.8) / 1.0,
      0,
      1
    );

    const lookEase =
      lookProgress * lookProgress * (3 - 2 * lookProgress);

    headGroup.rotation.x = THREE.MathUtils.lerp(
      0.12,
      -0.55,
      lookEase
    );

    // Rabbits rise into view one at a time.
    rabbits.forEach((entry) => {
      const revealProgress = THREE.MathUtils.clamp(
        (time - entry.revealDelay) / 0.35,
        0,
        1
      );

      if (revealProgress > 0) {
        entry.rabbit.visible = true;
      }

      const revealEase =
        revealProgress * revealProgress * (3 - 2 * revealProgress);

      entry.rabbit.position.y = THREE.MathUtils.lerp(
        entry.hiddenY,
        entry.shownY,
        revealEase
      );
    });

    // Rabbits blink once or twice, then burst into laughter.
    rabbits.forEach((entry) => {
      let blinkClosed = false;

      if (time < laughStartTime) {
        for (const offset of entry.blinkOffsets) {
          const blinkStart = entry.revealDelay + offset;
          if (time >= blinkStart && time <= blinkStart + 0.11) {
            blinkClosed = true;
          }
        }

        setRabbitBlinkState(entry, blinkClosed);

        entry.jaw.rotation.x = 0;
        entry.mouth.scale.set(1.1, 0.45, 0.35);
        entry.teethGroup.visible = false;
        entry.headGroup.position.y = 1.15;
      } else {
        const laughTime =
          time - laughStartTime + entry.laughPhase;

        const laughPulse = Math.max(
          0,
          Math.sin(laughTime * 10)
        );

        const laughBlink =
          Math.sin(laughTime * 6.5 + 1.2) > 0.9;

        setRabbitBlinkState(entry, laughBlink);

        // Open mouth and show teeth during the laugh beats.
        entry.jaw.rotation.x = 0.55 * laughPulse;
        entry.mouth.scale.set(
          1.1,
          0.45 + laughPulse * 0.55,
          0.35
        );
        entry.teethGroup.visible = laughPulse > 0.12;

        // Small bounce whenever expression opens up.
        entry.headGroup.position.y =
          1.15 + laughPulse * 0.08;
      }
    });

    bees.forEach((bee, i) => {
      const {
        speed,
        phase,
        leftWing,
        rightWing
      } = bee.userData;

      const t = time * speed + phase;

      const centerX =
        i === 0 ? -0.75 : 0.75;

      bee.position.x =
        centerX +
        Math.cos(t) * 0.55;

      bee.position.y =
        2.15 +
        Math.sin(t * 1.35) * 0.28;

      bee.position.z =
        Math.sin(t) * 0.35;

      bee.rotation.y =
        Math.sin(t * 1.5) * 0.7;

      const flap =
        Math.sin(time * 32 + phase) * 0.9;

      leftWing.rotation.z = flap;
      rightWing.rotation.z = -flap;
    });
  }

  return {
    config: SCENE_CONFIG,
    update
  };
}