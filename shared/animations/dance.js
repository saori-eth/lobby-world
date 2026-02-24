export function dance(bones) {
  const { hips, head, upperArm_L, upperArm_R, upperLeg_L, upperLeg_R, lowerLeg_L, lowerLeg_R } = bones;
  const hipsBaseY = hips.position.y;

  return {
    update(time) {
      const t = time * 6;
      const sway = Math.sin(time * 3);
      hips.position.y = hipsBaseY + Math.sin(t) * 0.04;
      head.rotation.z = sway * 0.15;
      upperArm_L.rotation.z = Math.sin(t) * 0.8 + 0.5;
      upperArm_R.rotation.z = Math.sin(t + Math.PI) * 0.8 - 0.5;
      upperArm_L.rotation.x = Math.sin(time * 3) * 0.3;
      upperArm_R.rotation.x = Math.sin(time * 3 + Math.PI) * 0.3;
      upperLeg_L.rotation.x = Math.sin(t) * 0.2;
      upperLeg_R.rotation.x = Math.sin(t + Math.PI) * 0.2;
      lowerLeg_L.rotation.x = Math.max(0, Math.sin(t)) * 0.3;
      lowerLeg_R.rotation.x = Math.max(0, Math.sin(t + Math.PI)) * 0.3;
    },
  };
}
