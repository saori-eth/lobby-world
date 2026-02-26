export default (world, app, fetch, props, setTimeout) => {
  const POWER_SCALE = 0.5;

  app.configure([
    {
      key: "jumpForce",
      type: "number",
      label: "Jump Force",
      dp: 1,
      min: 0,
      max: 50,
      step: 0.5,
      initial: 14,
    },
    {
      key: "forwardForce",
      type: "number",
      label: "Forward Force",
      dp: 1,
      min: 0,
      max: 30,
      step: 0.5,
      initial: 2,
    },
    {
      key: "lockDuration",
      type: "number",
      label: "Effect Duration",
      dp: 2,
      min: 0.05,
      max: 2,
      step: 0.05,
      initial: 0.2,
    },
    {
      key: "airSnare",
      type: "range",
      label: "Air Snare",
      min: 0,
      max: 1,
      step: 0.05,
      initial: 1,
    },
    {
      key: "cooldown",
      type: "number",
      label: "Cooldown",
      dp: 2,
      min: 0,
      max: 3,
      step: 0.05,
      initial: 0.75,
    },
    {
      key: "padColor",
      type: "color",
      label: "Pad Color",
      initial: "#253243",
    },
    {
      key: "neonColor",
      type: "color",
      label: "Neon Color",
      initial: "#35f3ff",
    },
    {
      key: "launchEmote",
      type: "file",
      kind: "emote",
      label: "Launch Emote",
    },
  ]);

  const block = app.get("Block");
  if (block) block.active = false;

  const padColor = app.config.padColor || "#253243";
  const neonColor = app.config.neonColor || "#35f3ff";

  const pad = app.create("group");
  const base = app.create("prim", {
    type: "box",
    size: [1.8, 0.24, 1.8],
    position: [0, 0.12, 0],
    color: padColor,
    physics: "static",
  });
  const topPlate = app.create("prim", {
    type: "box",
    size: [1.3, 0.06, 1.3],
    position: [0, 0.27, 0],
    color: "#3f4f65",
  });
  const core = app.create("prim", {
    type: "box",
    size: [0.52, 0.08, 0.52],
    position: [0, 0.34, 0],
    color: neonColor,
    emissive: neonColor,
    emissiveIntensity: 4,
  });
  const arrow = app.create("prim", {
    type: "box",
    size: [0.14, 0.01, 0.74],
    position: [0, 0.385, -0.06],
    color: neonColor,
    emissive: neonColor,
    emissiveIntensity: 4,
  });
  const arrowTip = app.create("prim", {
    type: "box",
    size: [0.38, 0.01, 0.2],
    position: [0, 0.385, -0.42],
    color: neonColor,
    emissive: neonColor,
    emissiveIntensity: 4,
  });

  pad.add(base);
  pad.add(topPlate);
  pad.add(core);
  pad.add(arrow);
  pad.add(arrowTip);
  app.add(pad);

  if (!world.isClient) return;

  const trigger = app.create("prim", {
    type: "box",
    size: [1.35, 1.2, 1.35],
    position: [0, 0.7, 0],
    opacity: 0,
    physics: "static",
    trigger: true,
  });
  app.add(trigger);

  const impulse = new Vector3();
  const launchDir = new Vector3();
  const forward = new Vector3(0, 0, -1);
  let lastLaunchAt = -Infinity;

  trigger.onTriggerEnter = (other) => {
    if (!other?.isLocalPlayer) return;

    const now = Date.now();
    const cooldownMs = Math.max(0, Number(app.config.cooldown ?? 0.75)) * 1000;
    if (now - lastLaunchAt < cooldownMs) return;
    lastLaunchAt = now;

    const player = world.getPlayer();
    if (!player) return;

    const jumpForce = Math.max(0, Number(app.config.jumpForce ?? 14));
    const forwardForce = Math.max(0, Number(app.config.forwardForce ?? 2));
    const lockDuration = Math.max(0.05, Number(app.config.lockDuration ?? 0.2));
    const airSnare = clamp(Number(app.config.airSnare ?? 1), 0, 1);

    // Uses Player.applyEffect from docs/scripting/world/Player.md
    const effect = {
      snare: airSnare,
      turn: true,
      duration: lockDuration,
      cancellable: false,
    };
    const emoteUrl = app.config.launchEmote?.url;
    if (emoteUrl) effect.emote = emoteUrl;
    player.applyEffect(effect);

    launchDir.copy(forward).applyQuaternion(app.quaternion);
    launchDir.y = 0;
    if (launchDir.lengthSq() > 0.000001) {
      launchDir.normalize();
    } else {
      launchDir.set(0, 0, -1);
    }

    impulse.set(
      launchDir.x * forwardForce * POWER_SCALE,
      jumpForce * POWER_SCALE,
      launchDir.z * forwardForce * POWER_SCALE,
    );
    player.push(impulse);
  };
};
