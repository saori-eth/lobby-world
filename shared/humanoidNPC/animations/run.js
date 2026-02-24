export function run(bones) {
  const { hips, head, upperArm_L, upperArm_R, lowerArm_L, lowerArm_R, upperLeg_L, upperLeg_R, lowerLeg_L, lowerLeg_R } = bones;
  const hipsBaseY = hips.position.y;

  return {
    update(time) {
      const t = time * 8;
      const swing = Math.sin(t);
      upperArm_L.rotation.x = swing * 0.6;
      upperArm_R.rotation.x = -swing * 0.6;
      lowerArm_L.rotation.x = -0.4;
      lowerArm_R.rotation.x = -0.4;
      upperLeg_L.rotation.x = -swing * 0.5;
      upperLeg_R.rotation.x = swing * 0.5;
      lowerLeg_L.rotation.x = Math.max(0, -Math.sin(t)) * 0.6;
      lowerLeg_R.rotation.x = Math.max(0, Math.sin(t)) * 0.6;
      hips.position.y = hipsBaseY + Math.abs(Math.sin(t)) * 0.03;
      head.rotation.x = Math.sin(t * 2) * 0.03;
    },
  };
}
