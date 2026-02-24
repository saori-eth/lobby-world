export function walk(bones) {
  const { hips, head, upperArm_L, upperArm_R, upperLeg_L, upperLeg_R, lowerLeg_L, lowerLeg_R } = bones;
  const hipsBaseY = hips.position.y;

  return {
    update(time) {
      const t = time * 5;
      const swing = Math.sin(t);
      upperArm_L.rotation.x = swing * 0.4;
      upperArm_R.rotation.x = -swing * 0.4;
      upperLeg_L.rotation.x = -swing * 0.35;
      upperLeg_R.rotation.x = swing * 0.35;
      lowerLeg_L.rotation.x = Math.max(0, -Math.sin(t)) * 0.3;
      lowerLeg_R.rotation.x = Math.max(0, Math.sin(t)) * 0.3;
      head.rotation.x = Math.sin(t * 2) * 0.02;
      hips.position.y = hipsBaseY + Math.sin(t * 2) * 0.01;
    },
  };
}
