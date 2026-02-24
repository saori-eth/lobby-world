import { buildBody } from "@shared/buildBody.js";

export function buildNPC(app, { scale = 1, colors = {} } = {}) {
  return buildBody(app, {
    scale,
    meshes: (app, armature) => attachNPCMeshes(app, armature, colors),
  });
}

function attachNPCMeshes(app, armature, colors) {
  const { bones } = armature;
  const s = armature.scale;
  const meshes = {};

  const torsoColor = colors.torso || "#4488cc";
  const collarColor = colors.collar || "#3377bb";
  const beltColor = colors.belt || "#664422";
  const skinColor = colors.skin || "#f0c8a0";
  const eyeColor = colors.eye || "#222222";
  const capColor = colors.cap || "#111111";
  const pantsColor = colors.pants || "#555555";
  const shoeColor = colors.shoe || "#332211";

  // --- Torso (on chest bone) ---
  const torso = app.create("prim", {
    type: "box",
    size: [0.5 * s, 0.6 * s, 0.3 * s],
    color: torsoColor,
    physics: "kinematic",
  });
  bones.chest.add(torso);
  meshes.chest = torso;

  const collar = app.create("prim", {
    type: "box",
    size: [0.44 * s, 0.08 * s, 0.28 * s],
    position: [0, 0.27 * s, 0],
    color: collarColor,
  });
  torso.add(collar);

  const belt = app.create("prim", {
    type: "box",
    size: [0.5 * s, 0.06 * s, 0.31 * s],
    position: [0, -0.28 * s, 0],
    color: beltColor,
  });
  torso.add(belt);

  // --- Head (on head bone) ---
  const head = app.create("prim", {
    type: "box",
    size: [0.4 * s, 0.4 * s, 0.4 * s],
    position: [0, 0.25 * s, 0],
    color: skinColor,
    physics: "kinematic",
  });
  bones.head.add(head);
  meshes.head = head;

  const eyeL = app.create("prim", {
    type: "box",
    size: [0.08 * s, 0.08 * s, 0.05 * s],
    position: [-0.1 * s, 0.05 * s, -0.2 * s],
    color: eyeColor,
  });
  const eyeR = app.create("prim", {
    type: "box",
    size: [0.08 * s, 0.08 * s, 0.05 * s],
    position: [0.1 * s, 0.05 * s, -0.2 * s],
    color: eyeColor,
  });
  head.add(eyeL);
  head.add(eyeR);

  const capCrown = app.create("prim", {
    type: "box",
    size: [0.42 * s, 0.14 * s, 0.42 * s],
    position: [0, 0.24 * s, 0],
    color: capColor,
  });
  head.add(capCrown);

  const capBrim = app.create("prim", {
    type: "box",
    size: [0.38 * s, 0.04 * s, 0.2 * s],
    position: [0, 0.19 * s, -0.24 * s],
    color: capColor,
  });
  head.add(capBrim);

  // --- Arms ---
  meshes.upperArm_L = app.create("prim", {
    type: "box",
    size: [0.2 * s, 0.28 * s, 0.2 * s],
    position: [0, -0.14 * s, 0],
    color: torsoColor,
  });
  bones.upperArm_L.add(meshes.upperArm_L);

  meshes.lowerArm_L = app.create("prim", {
    type: "box",
    size: [0.18 * s, 0.26 * s, 0.18 * s],
    position: [0, -0.13 * s, 0],
    color: skinColor,
  });
  bones.lowerArm_L.add(meshes.lowerArm_L);

  meshes.upperArm_R = app.create("prim", {
    type: "box",
    size: [0.2 * s, 0.28 * s, 0.2 * s],
    position: [0, -0.14 * s, 0],
    color: torsoColor,
  });
  bones.upperArm_R.add(meshes.upperArm_R);

  meshes.lowerArm_R = app.create("prim", {
    type: "box",
    size: [0.18 * s, 0.26 * s, 0.18 * s],
    position: [0, -0.13 * s, 0],
    color: skinColor,
  });
  bones.lowerArm_R.add(meshes.lowerArm_R);

  // --- Legs ---
  meshes.upperLeg_L = app.create("prim", {
    type: "box",
    size: [0.2 * s, 0.28 * s, 0.2 * s],
    position: [0, -0.14 * s, 0],
    color: pantsColor,
  });
  bones.upperLeg_L.add(meshes.upperLeg_L);

  meshes.lowerLeg_L = app.create("prim", {
    type: "box",
    size: [0.2 * s, 0.27 * s, 0.2 * s],
    position: [0, -0.135 * s, 0],
    color: pantsColor,
  });
  bones.lowerLeg_L.add(meshes.lowerLeg_L);

  meshes.foot_L = app.create("prim", {
    type: "box",
    size: [0.22 * s, 0.08 * s, 0.26 * s],
    position: [0, -0.04 * s, -0.02 * s],
    color: shoeColor,
  });
  bones.foot_L.add(meshes.foot_L);

  meshes.upperLeg_R = app.create("prim", {
    type: "box",
    size: [0.2 * s, 0.28 * s, 0.2 * s],
    position: [0, -0.14 * s, 0],
    color: pantsColor,
  });
  bones.upperLeg_R.add(meshes.upperLeg_R);

  meshes.lowerLeg_R = app.create("prim", {
    type: "box",
    size: [0.2 * s, 0.27 * s, 0.2 * s],
    position: [0, -0.135 * s, 0],
    color: pantsColor,
  });
  bones.lowerLeg_R.add(meshes.lowerLeg_R);

  meshes.foot_R = app.create("prim", {
    type: "box",
    size: [0.22 * s, 0.08 * s, 0.26 * s],
    position: [0, -0.04 * s, -0.02 * s],
    color: shoeColor,
  });
  bones.foot_R.add(meshes.foot_R);

  return meshes;
}
