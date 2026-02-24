export function wave(bones) {
  const { head, upperArm_L, upperArm_R, lowerArm_R } = bones;

  return {
    update(time) {
      upperArm_R.rotation.z = -2.5;
      lowerArm_R.rotation.x = Math.sin(time * 6) * 0.4;
      upperArm_L.rotation.z = Math.sin(time * 0.8) * 0.03;
      head.rotation.x = Math.sin(time * 2) * 0.05;
      head.rotation.z = Math.sin(time * 2) * 0.05;
    },
  };
}
