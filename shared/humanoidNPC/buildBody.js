// Reusable humanoid body builder
// Default meshes are slim bone-outline prims — a minimal stick-figure silhouette.
// Apps can override by passing a custom `meshes` callback.

import { createArmature } from "./armature.js";
import { createAnimator } from "./animator.js";

// Default bone-outline mesh definitions
// Proportions trace each bone segment with thin boxes
const DEFAULT_MESHES = {
  chest: { size: [0.28, 0.5, 0.16], position: [0, 0, 0], physics: "kinematic" },
  head: { size: [0.22, 0.22, 0.22], position: [0, 0.2, 0], physics: "kinematic" },
  upperArm_L: { size: [0.09, 0.28, 0.09], position: [0, -0.14, 0] },
  lowerArm_L: { size: [0.07, 0.26, 0.07], position: [0, -0.13, 0] },
  hand_L: { size: [0.08, 0.08, 0.04], position: [0, -0.04, 0] },
  upperArm_R: { size: [0.09, 0.28, 0.09], position: [0, -0.14, 0] },
  lowerArm_R: { size: [0.07, 0.26, 0.07], position: [0, -0.13, 0] },
  hand_R: { size: [0.08, 0.08, 0.04], position: [0, -0.04, 0] },
  upperLeg_L: { size: [0.1, 0.28, 0.1], position: [0, -0.14, 0] },
  lowerLeg_L: { size: [0.09, 0.27, 0.09], position: [0, -0.135, 0] },
  foot_L: { size: [0.1, 0.05, 0.16], position: [0, -0.02, -0.02] },
  upperLeg_R: { size: [0.1, 0.28, 0.1], position: [0, -0.14, 0] },
  lowerLeg_R: { size: [0.09, 0.27, 0.09], position: [0, -0.135, 0] },
  foot_R: { size: [0.1, 0.05, 0.16], position: [0, -0.02, -0.02] },
};

function createPrim(app, def, s, fallbackColor) {
  const pos = def.position || [0, 0, 0];
  const opts = {
    type: "box",
    size: [def.size[0] * s, def.size[1] * s, def.size[2] * s],
    position: [pos[0] * s, pos[1] * s, pos[2] * s],
    color: def.color || fallbackColor,
    physics: def.physics || null,
  };
  if (def.rotation) opts.rotation = def.rotation;
  return app.create("prim", opts);
}

function attachMeshes(app, armature, meshDefs, fallbackColor, npcId) {
  const s = armature.scale;
  const meshes = {};
  for (const boneName in meshDefs) {
    const def = meshDefs[boneName];
    const mesh = createPrim(app, def, s, fallbackColor);
    if (npcId) {
      mesh.tag = `npc:${npcId}`;
      if (!mesh.physics) mesh.physics = "kinematic";
    }
    armature.bones[boneName].add(mesh);
    meshes[boneName] = mesh;
    if (def.children) {
      for (const childDef of def.children) {
        const child = createPrim(app, childDef, s, fallbackColor);
        mesh.add(child);
      }
    }
  }
  return meshes;
}

export function buildBody(
  app,
  { scale = 1, color = "#aaaaaa", meshes: meshOption, npcId } = {},
) {
  const armature = createArmature(app, { scale });
  const animator = createAnimator(armature);

  let meshes;
  if (typeof meshOption === "function") {
    meshes = meshOption(app, armature);
  } else {
    meshes = attachMeshes(
      app,
      armature,
      meshOption || DEFAULT_MESHES,
      color,
      npcId,
    );
  }

  return { root: armature.root, armature, animator, meshes };
}
