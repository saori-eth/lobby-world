// Shared humanoid armature — reusable skeleton for any NPC
// Bone hierarchy:
//   root (ground level)
//     └─ bodyPivot (pivot at feet for death-fall)
//        └─ hips
//           ├─ spine → chest → head
//           ├─ shoulder_L → upperArm_L → lowerArm_L → hand_L
//           ├─ shoulder_R → upperArm_R → lowerArm_R → hand_R
//           ├─ upperLeg_L → lowerLeg_L → foot_L
//           └─ upperLeg_R → lowerLeg_R → foot_R

const BONE_DATA = {
  hips:        { parent: null,          offset: [0, 0.95, 0] },
  spine:       { parent: "hips",        offset: [0, 0.05, 0] },
  chest:       { parent: "spine",       offset: [0, 0.0, 0] },
  head:        { parent: "chest",       offset: [0, 0.3, 0] },
  shoulder_L:  { parent: "chest",       offset: [-0.35, 0.25, 0] },
  upperArm_L:  { parent: "shoulder_L",  offset: [0, 0, 0] },
  lowerArm_L:  { parent: "upperArm_L",  offset: [0, -0.28, 0] },
  hand_L:      { parent: "lowerArm_L",  offset: [0, -0.26, 0] },
  shoulder_R:  { parent: "chest",       offset: [0.35, 0.25, 0] },
  upperArm_R:  { parent: "shoulder_R",  offset: [0, 0, 0] },
  lowerArm_R:  { parent: "upperArm_R",  offset: [0, -0.28, 0] },
  hand_R:      { parent: "lowerArm_R",  offset: [0, -0.26, 0] },
  upperLeg_L:  { parent: "hips",        offset: [-0.13, -0.3, 0] },
  lowerLeg_L:  { parent: "upperLeg_L",  offset: [0, -0.28, 0] },
  foot_L:      { parent: "lowerLeg_L",  offset: [0, -0.27, 0] },
  upperLeg_R:  { parent: "hips",        offset: [0.13, -0.3, 0] },
  lowerLeg_R:  { parent: "upperLeg_R",  offset: [0, -0.28, 0] },
  foot_R:      { parent: "lowerLeg_R",  offset: [0, -0.27, 0] },
};

const UPPER_BONES = new Set([
  "spine", "chest", "head",
  "shoulder_L", "upperArm_L", "lowerArm_L", "hand_L",
  "shoulder_R", "upperArm_R", "lowerArm_R", "hand_R",
]);

export { BONE_DATA, UPPER_BONES };

export function createArmature(app, { scale = 1 } = {}) {
  const root = app.create("group");
  const bodyPivot = app.create("group");
  root.add(bodyPivot);

  const bones = {};

  // Create all bone groups
  for (const name in BONE_DATA) {
    const bone = app.create("group");
    const d = BONE_DATA[name];
    bone.position.set(d.offset[0] * scale, d.offset[1] * scale, d.offset[2] * scale);
    bones[name] = bone;
  }

  // Build hierarchy
  for (const name in BONE_DATA) {
    const d = BONE_DATA[name];
    if (d.parent) {
      bones[d.parent].add(bones[name]);
    } else {
      bodyPivot.add(bones[name]);
    }
  }

  // Save rest pose for reset
  const restPose = {};
  for (const name in bones) {
    const b = bones[name];
    restPose[name] = {
      px: b.position.x, py: b.position.y, pz: b.position.z,
      rx: b.rotation.x, ry: b.rotation.y, rz: b.rotation.z,
    };
  }

  function resetToRest() {
    for (const name in bones) {
      const b = bones[name];
      const r = restPose[name];
      b.position.set(r.px, r.py, r.pz);
      b.rotation.set(r.rx, r.ry, r.rz);
    }
  }

  function getBone(name) {
    return bones[name];
  }

  return { root, bodyPivot, bones, getBone, resetToRest, scale };
}
