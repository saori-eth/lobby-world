// Shared procedural animation system for humanoid armatures
// Emote indices: 0=walk, 1=run, 2=idle, 3=wave, 4=dance

export function createAnimator(armature) {
  const { bones, resetToRest } = armature;
  const hips = bones.hips;
  const head = bones.head;
  const upperArm_L = bones.upperArm_L;
  const upperArm_R = bones.upperArm_R;
  const lowerArm_L = bones.lowerArm_L;
  const lowerArm_R = bones.lowerArm_R;
  const upperLeg_L = bones.upperLeg_L;
  const upperLeg_R = bones.upperLeg_R;
  const lowerLeg_L = bones.lowerLeg_L;
  const lowerLeg_R = bones.lowerLeg_R;

  let time = 0;
  let currentEmote = 2; // idle
  const hipsBaseY = hips.position.y;

  function update(delta) {
    time += delta;

    if (currentEmote === 0) {
      // Walk
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
    } else if (currentEmote === 1) {
      // Run
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
    } else if (currentEmote === 2) {
      // Idle
      const breath = Math.sin(time * 1.5);
      hips.position.y = hipsBaseY + breath * 0.01;
      upperArm_L.rotation.z = Math.sin(time * 0.8) * 0.03;
      upperArm_R.rotation.z = -Math.sin(time * 0.8) * 0.03;
      head.rotation.y = Math.sin(time * 0.5) * 0.1;
      head.rotation.x = Math.sin(time * 0.7) * 0.03;
    } else if (currentEmote === 3) {
      // Wave
      upperArm_R.rotation.z = -2.5;
      lowerArm_R.rotation.x = Math.sin(time * 6) * 0.4;
      upperArm_L.rotation.z = Math.sin(time * 0.8) * 0.03;
      head.rotation.x = Math.sin(time * 2) * 0.05;
      head.rotation.z = Math.sin(time * 2) * 0.05;
    } else if (currentEmote === 4) {
      // Dance
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
    }
  }

  function setEmote(idx) {
    if (idx === currentEmote) return;
    currentEmote = idx != null ? idx : 2;
    resetToRest();
  }

  return { update, setEmote };
}
