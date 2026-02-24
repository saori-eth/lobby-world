export function idle(bones) {
  const { hips, head, upperArm_L, upperArm_R } = bones;
  const hipsBaseY = hips.position.y;

  return {
    update(time) {
      const breath = Math.sin(time * 1.5);
      hips.position.y = hipsBaseY + breath * 0.01;
      upperArm_L.rotation.z = Math.sin(time * 0.8) * 0.03;
      upperArm_R.rotation.z = -Math.sin(time * 0.8) * 0.03;
      head.rotation.y = Math.sin(time * 0.5) * 0.1;
      head.rotation.x = Math.sin(time * 0.7) * 0.03;
    },
  };
}
