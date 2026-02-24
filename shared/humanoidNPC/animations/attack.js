export function attack(bones) {
  const { upperArm_R, lowerArm_R, chest } = bones;

  return {
    update(time) {
      // Fast overhead swing cycle (~0.4s)
      const t = (time % 0.4) / 0.4;

      // Raise arm up then swing down
      if (t < 0.4) {
        // Wind up: raise arm
        const p = t / 0.4;
        upperArm_R.rotation.x = -Math.PI * 0.8 * p;
        upperArm_R.rotation.z = -0.3 * p;
        lowerArm_R.rotation.x = -Math.PI * 0.3 * p;
      } else {
        // Swing down
        const p = (t - 0.4) / 0.6;
        upperArm_R.rotation.x = -Math.PI * 0.8 + Math.PI * 1.1 * p;
        upperArm_R.rotation.z = -0.3 * (1 - p);
        lowerArm_R.rotation.x = -Math.PI * 0.3 + Math.PI * 0.5 * p;
      }

      // Slight chest lean into swing
      chest.rotation.x = Math.sin(time * Math.PI * 2 / 0.4) * 0.1;
    },
  };
}
