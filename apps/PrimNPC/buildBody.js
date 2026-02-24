// --- Prim NPC body builder (hierarchical armature) ---
export function buildBody(app) {
  const root = app.create("group");

  // Torso
  const torso = app.create("prim", {
    type: "box",
    size: [0.5, 0.6, 0.3],
    position: [0, 1, 0],
    color: "#4488cc",
    physics: "kinematic",
  });

  // Collar detail
  const collar = app.create("prim", {
    type: "box",
    size: [0.44, 0.08, 0.28],
    position: [0, 0.27, 0],
    color: "#3377bb",
  });
  torso.add(collar);

  // Belt detail
  const belt = app.create("prim", {
    type: "box",
    size: [0.5, 0.06, 0.31],
    position: [0, -0.28, 0],
    color: "#664422",
  });
  torso.add(belt);

  // --- Head pivot (at top of torso) ---
  const headPivot = app.create("group");
  headPivot.position.set(0, 0.3, 0);

  const head = app.create("prim", {
    type: "box",
    size: [0.4, 0.4, 0.4],
    position: [0, 0.25, 0],
    color: "#f0c8a0",
    physics: "kinematic",
  });

  // Eyes (children of head)
  const eyeL = app.create("prim", {
    type: "box",
    size: [0.08, 0.08, 0.05],
    position: [-0.1, 0.05, -0.2],
    color: "#222222",
  });
  const eyeR = app.create("prim", {
    type: "box",
    size: [0.08, 0.08, 0.05],
    position: [0.1, 0.05, -0.2],
    color: "#222222",
  });
  head.add(eyeL);
  head.add(eyeR);

  // Baseball cap — low-profile crown + front brim
  const capCrown = app.create("prim", {
    type: "box",
    size: [0.42, 0.14, 0.42],
    position: [0, 0.24, 0],
    color: "#111111",
  });
  head.add(capCrown);

  // Front brim (extends forward)
  const capBrim = app.create("prim", {
    type: "box",
    size: [0.38, 0.04, 0.2],
    position: [0, 0.19, -0.24],
    color: "#111111",
  });
  head.add(capBrim);

  headPivot.add(head);
  torso.add(headPivot);

  // --- Left arm pivot (at shoulder) ---
  const armLPivot = app.create("group");
  armLPivot.position.set(-0.35, 0.25, 0);

  const armLUpper = app.create("prim", {
    type: "box",
    size: [0.2, 0.28, 0.2],
    position: [0, -0.14, 0],
    color: "#4488cc",
  });
  const armLLower = app.create("prim", {
    type: "box",
    size: [0.18, 0.26, 0.18],
    position: [0, -0.27, 0],
    color: "#f0c8a0",
  });
  armLUpper.add(armLLower);
  armLPivot.add(armLUpper);
  torso.add(armLPivot);

  // --- Right arm pivot (at shoulder) ---
  const armRPivot = app.create("group");
  armRPivot.position.set(0.35, 0.25, 0);

  const armRUpper = app.create("prim", {
    type: "box",
    size: [0.2, 0.28, 0.2],
    position: [0, -0.14, 0],
    color: "#4488cc",
  });
  const armRLower = app.create("prim", {
    type: "box",
    size: [0.18, 0.26, 0.18],
    position: [0, -0.27, 0],
    color: "#f0c8a0",
  });
  armRUpper.add(armRLower);
  armRPivot.add(armRUpper);
  torso.add(armRPivot);

  // --- Left leg pivot (at hip) ---
  const legLPivot = app.create("group");
  legLPivot.position.set(-0.13, -0.3, 0);

  const legLUpper = app.create("prim", {
    type: "box",
    size: [0.2, 0.28, 0.2],
    position: [0, -0.14, 0],
    color: "#555555",
  });
  const legLLower = app.create("prim", {
    type: "box",
    size: [0.2, 0.27, 0.2],
    position: [0, -0.275, 0],
    color: "#555555",
  });
  // Shoe
  const shoeL = app.create("prim", {
    type: "box",
    size: [0.22, 0.08, 0.26],
    position: [0, -0.175, -0.02],
    color: "#332211",
  });
  legLLower.add(shoeL);
  legLUpper.add(legLLower);
  legLPivot.add(legLUpper);
  torso.add(legLPivot);

  // --- Right leg pivot (at hip) ---
  const legRPivot = app.create("group");
  legRPivot.position.set(0.13, -0.3, 0);

  const legRUpper = app.create("prim", {
    type: "box",
    size: [0.2, 0.28, 0.2],
    position: [0, -0.14, 0],
    color: "#555555",
  });
  const legRLower = app.create("prim", {
    type: "box",
    size: [0.2, 0.27, 0.2],
    position: [0, -0.275, 0],
    color: "#555555",
  });
  // Shoe
  const shoeR = app.create("prim", {
    type: "box",
    size: [0.22, 0.08, 0.26],
    position: [0, -0.175, -0.02],
    color: "#332211",
  });
  legRLower.add(shoeR);
  legRUpper.add(legRLower);
  legRPivot.add(legRUpper);
  torso.add(legRPivot);

  // Body pivot at foot level — rotating its X tips the whole body forward/back
  const bodyPivot = app.create("group");
  bodyPivot.add(torso);
  root.add(bodyPivot);

  return {
    root,
    bodyPivot,
    headPivot,
    armLPivot,
    armRPivot,
    armLLower,
    armRLower,
    legLPivot,
    legRPivot,
    legLLower,
    legRLower,
    torso,
  };
}

// --- Procedural animation system (rotation-based) ---
// Emote indices: 0=walk, 1=run, 2=idle, 3=wave, 4=dance
export function createAnimator(parts) {
  const {
    headPivot,
    armLPivot,
    armRPivot,
    armLLower,
    armRLower,
    legLPivot,
    legRPivot,
    legLLower,
    legRLower,
    torso,
  } = parts;

  let time = 0;
  let currentEmote = 2; // idle
  const torsoBaseY = 1;

  function resetPose() {
    headPivot.rotation.set(0, 0, 0);
    armLPivot.rotation.set(0, 0, 0);
    armRPivot.rotation.set(0, 0, 0);
    armLLower.rotation.set(0, 0, 0);
    armRLower.rotation.set(0, 0, 0);
    legLPivot.rotation.set(0, 0, 0);
    legRPivot.rotation.set(0, 0, 0);
    legLLower.rotation.set(0, 0, 0);
    legRLower.rotation.set(0, 0, 0);
    torso.position.y = torsoBaseY;
  }

  function update(delta) {
    time += delta;

    if (currentEmote === 0) {
      // Walk — pendulum limb swings
      const t = time * 5;
      const swing = Math.sin(t);
      armLPivot.rotation.x = swing * 0.4;
      armRPivot.rotation.x = -swing * 0.4;
      legLPivot.rotation.x = -swing * 0.35;
      legRPivot.rotation.x = swing * 0.35;
      // Slight knee bend at peak of step
      legLLower.rotation.x = Math.max(0, -Math.sin(t)) * 0.3;
      legRLower.rotation.x = Math.max(0, Math.sin(t)) * 0.3;
      // Subtle head bob
      headPivot.rotation.x = Math.sin(t * 2) * 0.02;
      torso.position.y = torsoBaseY + Math.sin(t * 2) * 0.01;
    } else if (currentEmote === 1) {
      // Run — faster, wider swings, more knee bend
      const t = time * 8;
      const swing = Math.sin(t);
      armLPivot.rotation.x = swing * 0.6;
      armRPivot.rotation.x = -swing * 0.6;
      armLLower.rotation.x = -0.4; // arms bent while running
      armRLower.rotation.x = -0.4;
      legLPivot.rotation.x = -swing * 0.5;
      legRPivot.rotation.x = swing * 0.5;
      legLLower.rotation.x = Math.max(0, -Math.sin(t)) * 0.6;
      legRLower.rotation.x = Math.max(0, Math.sin(t)) * 0.6;
      // Bounce
      torso.position.y = torsoBaseY + Math.abs(Math.sin(t)) * 0.03;
      headPivot.rotation.x = Math.sin(t * 2) * 0.03;
    } else if (currentEmote === 2) {
      // Idle — gentle breathing and sway
      const breath = Math.sin(time * 1.5);
      torso.position.y = torsoBaseY + breath * 0.01;
      armLPivot.rotation.z = Math.sin(time * 0.8) * 0.03;
      armRPivot.rotation.z = -Math.sin(time * 0.8) * 0.03;
      headPivot.rotation.y = Math.sin(time * 0.5) * 0.1;
      headPivot.rotation.x = Math.sin(time * 0.7) * 0.03;
    } else if (currentEmote === 3) {
      // Wave — right arm raised and waving
      armRPivot.rotation.z = -2.5;
      armRLower.rotation.x = Math.sin(time * 6) * 0.4;
      // Slight idle on other parts
      armLPivot.rotation.z = Math.sin(time * 0.8) * 0.03;
      headPivot.rotation.x = Math.sin(time * 2) * 0.05;
      headPivot.rotation.z = Math.sin(time * 2) * 0.05;
    } else if (currentEmote === 4) {
      // Dance — torso sway, alternating arm raises, hip motion
      const t = time * 6;
      const sway = Math.sin(time * 3);
      torso.position.y = torsoBaseY + Math.sin(t) * 0.04;
      headPivot.rotation.z = sway * 0.15;
      armLPivot.rotation.z = Math.sin(t) * 0.8 + 0.5;
      armRPivot.rotation.z = Math.sin(t + Math.PI) * 0.8 - 0.5;
      armLPivot.rotation.x = Math.sin(time * 3) * 0.3;
      armRPivot.rotation.x = Math.sin(time * 3 + Math.PI) * 0.3;
      legLPivot.rotation.x = Math.sin(t) * 0.2;
      legRPivot.rotation.x = Math.sin(t + Math.PI) * 0.2;
      legLLower.rotation.x = Math.max(0, Math.sin(t)) * 0.3;
      legRLower.rotation.x = Math.max(0, Math.sin(t + Math.PI)) * 0.3;
    }
  }

  function setEmote(idx) {
    if (idx === currentEmote) return;
    currentEmote = idx != null ? idx : 2;
    resetPose();
  }

  return { update, setEmote };
}
