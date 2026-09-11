import * as THREE from 'three';
import { createBear } from '../characters/bear.js';
import { createGround } from '../environment/ground.js';
import { createBackdrop } from '../environment/backdrop.js';
import { createTree } from '../props/tree.js';
import { createHoneycomb } from '../props/honeycomb.js';
import { createPit } from '../props/pit.js';
import { createBees, keepBeeOutsideTrunk } from '../props/bees.js';
import { createScentTrail } from '../props/scentTrail.js';
import { lerpProgress } from '../animation/animationUtils.js';

export const SCENE_CONFIG = {
  id: 'bear-honey-trap',
  title: 'Bear Honey Trap'
};

export function createBearHoneyTrapScene({ scene }) {
  scene.background = new THREE.Color(0x9fd6ff);

  const ground = createGround();
  scene.add(ground);

  const honeycomb = createHoneycomb();
  const { tree, trunk, branchPivot } = createTree({ honeycomb });
  scene.add(tree);

  const bees = createBees({ honeycomb });

  const { pitGroup, pitLeaves } = createPit();
  scene.add(pitGroup);

  const {
    bear,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    nose
  } = createBear();
  scene.add(bear);

  const { smellGroup, smellParticles } = createScentTrail();
  scene.add(smellGroup);

  const sunlight = new THREE.DirectionalLight(0xffffff, 2.5);
  sunlight.position.set(5, 10, 5);
  scene.add(sunlight);

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));

  scene.add(createBackdrop());

  let bearAttachedToBranch = false;

  let branchBroken = false;
  let branchFallStartY = 0;
  let branchFallStartRotation = 0;

  let leavesCollapsed = false;
  let leafCollapseStartTime = 0;

  let beesDetached = false;
  let beeEscapeStartTime = 0;

  function update(time) {
    smellParticles.forEach((particle, i) => {
      particle.position.z =
        0.4 + Math.sin(time * 2.5 + i * 0.7) * 0.18;

      particle.material.opacity =
        0.35 + Math.sin(time * 2 + i) * 0.15;
    });

    nose.scale.y = 1 + Math.sin(time * 10) * 0.15;
    nose.scale.x = 1 + Math.sin(time * 10) * 0.08;

    const walkProgress = lerpProgress(time, 2, 4);

    if (time < 7) {
      bear.position.x = THREE.MathUtils.lerp(
        -3,
        -0.9,
        walkProgress
      );

      if (walkProgress > 0 && walkProgress < 1) {
        const swing = Math.sin(time * 8) * 0.45;

        leftLeg.rotation.x = swing;
        rightLeg.rotation.x = -swing;

        leftArm.rotation.x = -swing;
        rightArm.rotation.x = swing;

        bear.position.y = Math.abs(Math.sin(time * 8)) * 0.06;
      } else {
        bear.position.y = 0;
      }
    }

    if (time > 6 && time < 7.5) {
      headGroup.rotation.x = THREE.MathUtils.lerp(
        headGroup.rotation.x,
        -0.65,
        0.06
      );
    }

    const climbProgress = lerpProgress(time, 7.5, 3.5);

    if (time >= 7.5 && time < 11) {
      bear.position.x = THREE.MathUtils.lerp(
        -0.9,
        -0.45,
        climbProgress
      );

      bear.position.y = THREE.MathUtils.lerp(
        0,
        2.15,
        climbProgress
      );

      headGroup.rotation.x = THREE.MathUtils.lerp(
        headGroup.rotation.x,
        0,
        0.05
      );

      if (climbProgress < 1) {
        const climbSwing = Math.sin(time * 10) * 0.7;

        leftArm.rotation.x = climbSwing;
        rightArm.rotation.x = -climbSwing;

        leftLeg.rotation.x = -climbSwing;
        rightLeg.rotation.x = climbSwing;

        bear.rotation.z = Math.sin(time * 10) * 0.03;
      } else {
        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;

        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;

        bear.rotation.z = 0;
      }
    }

    const branchProgress = lerpProgress(time, 11, 3);

    if (time >= 11 && time < 14.5) {
      bear.position.x = THREE.MathUtils.lerp(
        -0.45,
        1.45,
        branchProgress
      );

      bear.position.y = THREE.MathUtils.lerp(
        2.5,
        2.65,
        branchProgress
      );

      const lieProgress = Math.min(branchProgress * 2, 1);

      bear.rotation.order = 'YXZ';

      bear.rotation.x = THREE.MathUtils.lerp(
        0,
        -Math.PI / 2,
        lieProgress
      );

      bear.rotation.y = THREE.MathUtils.lerp(
        0,
        -Math.PI / 2,
        lieProgress
      );

      bear.rotation.z = 0;

      if (branchProgress < 1) {
        const crawlSwing = Math.sin(time * 9) * 0.18;

        leftArm.rotation.x = -1.0 + crawlSwing;
        rightArm.rotation.x = -1.0 + crawlSwing;

        leftLeg.rotation.x = -crawlSwing * 1.8;
        rightLeg.rotation.x = crawlSwing * 1.8;
      }
    }

    const reachProgress = lerpProgress(time, 14, 1.5);

    if (time >= 14) {
      leftArm.rotation.x = THREE.MathUtils.lerp(
        leftArm.rotation.x,
        -1.1,
        0.06
      );

      rightArm.rotation.x = THREE.MathUtils.lerp(
        rightArm.rotation.x,
        -1.1,
        0.06
      );

      leftArm.scale.y = THREE.MathUtils.lerp(
        1,
        1.35,
        reachProgress
      );

      rightArm.scale.y = THREE.MathUtils.lerp(
        1,
        1.35,
        reachProgress
      );
    }

    const bendProgress = lerpProgress(time, 14.5, 1);

    if (time >= 14.5 && !bearAttachedToBranch) {
      branchPivot.attach(bear);
      bearAttachedToBranch = true;
    }

    if (time >= 14.5 && time < 16.2) {
      branchPivot.rotation.z = THREE.MathUtils.lerp(
        0,
        -0.12,
        bendProgress
      );
    }

    const fallProgress = lerpProgress(time, 16.2, 1.4);

    if (time >= 16.2 && !branchBroken) {
      scene.attach(branchPivot);

      branchBroken = true;

      branchFallStartY = branchPivot.position.y;
      branchFallStartRotation = branchPivot.rotation.z;
    }

    if (branchBroken) {
      const fallEase = fallProgress * fallProgress;

      branchPivot.position.y = THREE.MathUtils.lerp(
        branchFallStartY,
        -3.5,
        fallEase
      );

      branchPivot.rotation.z = THREE.MathUtils.lerp(
        branchFallStartRotation,
        -0.65,
        fallProgress
      );
    }

    if (branchBroken && !beesDetached) {
      beeEscapeStartTime = time;

      bees.forEach((bee) => {
        scene.attach(bee);

        bee.userData.escapeStart.copy(
          bee.position
        );
      });

      beesDetached = true;
    }

    if (
      branchBroken &&
      !leavesCollapsed &&
      branchPivot.position.y <= 0.65
    ) {
      leavesCollapsed = true;
      leafCollapseStartTime = time;
    }

    if (leavesCollapsed) {
      const leafFallProgress = lerpProgress(time, leafCollapseStartTime, 1.0);

      const leafFallEase =
        leafFallProgress * leafFallProgress;

      pitLeaves.forEach((leaf, i) => {
        leaf.position.x = THREE.MathUtils.lerp(
          leaf.userData.startX,
          leaf.userData.startX * 0.25,
          leafFallProgress
        );

        leaf.position.z = THREE.MathUtils.lerp(
          leaf.userData.startZ,
          leaf.userData.startZ * 0.25,
          leafFallProgress
        );

        leaf.position.y =
          leaf.userData.startY -
          leafFallEase * (3.2 + (i % 5) * 0.15);

        leaf.rotation.x =
          leaf.userData.startRotX +
          leafFallProgress * (2 + (i % 3));

        leaf.rotation.z =
          leaf.userData.startRotZ +
          leafFallProgress * (2.5 + (i % 4));
      });
    }

    bees.forEach((bee, i) => {
      const {
        speed,
        phase,
        leftWing,
        rightWing,
        escapeStart
      } = bee.userData;

      const t = time * speed + phase;

      if (!beesDetached) {
        const angle = t + i * Math.PI;

        const radiusX = 0.62 + i * 0.08;
        const radiusY = 0.42 + i * 0.05;

        bee.position.x =
          Math.cos(angle) * radiusX;

        bee.position.y =
          Math.sin(angle * 1.15) * radiusY;

        bee.position.z =
          (i === 0 ? 0.28 : -0.28) +
          Math.sin(angle * 1.6) * 0.06;
      } else {
        const escapeProgress = lerpProgress(time, beeEscapeStartTime, 1.2);

        const smoothEscape =
          escapeProgress *
          escapeProgress *
          (3 - 2 * escapeProgress);

        const radius = 1.15 + i * 0.35;

        const targetX =
          pitGroup.position.x +
          Math.cos(t) * radius;

        const targetY =
          0.9 +
          Math.sin(t * 1.7) * 0.25;

        const targetZ =
          pitGroup.position.z +
          Math.sin(t) * 0.65;

        const targetWorld = new THREE.Vector3(
          THREE.MathUtils.lerp(
            escapeStart.x,
            targetX,
            smoothEscape
          ),

          THREE.MathUtils.lerp(
            escapeStart.y,
            targetY,
            smoothEscape
          ),

          THREE.MathUtils.lerp(
            escapeStart.z,
            targetZ,
            smoothEscape
          )
        );

        keepBeeOutsideTrunk(targetWorld, trunk);

        bee.position.copy(targetWorld);
      }

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
