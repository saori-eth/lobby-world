export default (world, app, fetch, props, setTimeout) => {
  app.configure([
    {
      key: "attackEmote",
      type: "file",
      kind: "emote",
      label: "Attack Emote",
    },
  ]);

  const block = app.get("Block");
  if (block) block.active = false;

  // Server: relay attack events to other apps
  if (world.isServer) {
    app.on("attack", (data) => {
      app.emit("sword-attack", data);
    });
    return;
  }

  // --- Client ---

  function buildSword() {
    const sword = app.create("group");

    const blade = app.create("prim", {
      type: "box",
      size: [0.06, 0.7, 0.04],
      position: [0, 0.55, 0],
      color: "#ccccdd",
    });

    const tip = app.create("prim", {
      type: "box",
      size: [0.04, 0.12, 0.03],
      position: [0, 0.96, 0],
      color: "#ccccdd",
    });

    const guard = app.create("prim", {
      type: "box",
      size: [0.22, 0.04, 0.06],
      position: [0, 0.2, 0],
      color: "#8B7333",
    });

    const grip = app.create("prim", {
      type: "box",
      size: [0.05, 0.2, 0.05],
      position: [0, 0.08, 0],
      color: "#442211",
    });

    const pommel = app.create("prim", {
      type: "box",
      size: [0.07, 0.05, 0.05],
      position: [0, -0.04, 0],
      color: "#8B7333",
    });

    sword.add(blade);
    sword.add(tip);
    sword.add(guard);
    sword.add(grip);
    sword.add(pommel);

    return sword;
  }

  // Track a sword per player
  const swords = new Map();
  const offsetQuat = new Quaternion().setFromEuler(
    new Euler(-90 * DEG2RAD, 0, 0),
  );

  function addPlayer(player) {
    if (swords.has(player.id)) return;
    const sword = buildSword();
    world.add(sword);
    swords.set(player.id, {
      sword,
      pos: new Vector3(),
      quat: new Quaternion(),
      offset: new Vector3(),
    });
  }

  function removePlayer(player) {
    const entry = swords.get(player.id);
    if (entry) {
      world.remove(entry.sword);
      swords.delete(player.id);
    }
  }

  // Init swords for all current players
  for (const player of world.getPlayers()) {
    addPlayer(player);
  }
  world.on("enter", addPlayer);
  world.on("leave", removePlayer);

  // Set reticle immediately (always equipped)
  const reticleConfig = {
    color: "#ccccdd",
    opacity: 0.85,
    spread: 0,
    layers: [
      { shape: "line", length: 5, gap: 3, angle: 0, thickness: 1.5 },
      { shape: "line", length: 5, gap: 3, angle: 180, thickness: 1.5 },
      {
        shape: "line",
        length: 5,
        gap: 2,
        angle: 90,
        thickness: 2,
        color: "#8B7333",
      },
      {
        shape: "line",
        length: 5,
        gap: 2,
        angle: 270,
        thickness: 2,
        color: "#8B7333",
      },
      { shape: "dot", radius: 1.5, color: "#8B7333" },
    ],
  };
  world.setReticle(reticleConfig);

  // Update all swords to track each player's right hand
  app.on("update", (delta) => {
    for (const player of world.getPlayers()) {
      const entry = swords.get(player.id);
      if (!entry) {
        addPlayer(player);
        continue;
      }
      const matrix = player.getBoneTransform("rightHand");
      if (!matrix) continue;
      entry.pos.setFromMatrixPosition(matrix);
      entry.quat.setFromRotationMatrix(matrix);
      entry.offset.set(0.1, 0, 0).applyQuaternion(entry.quat);
      entry.pos.add(entry.offset);
      entry.sword.position.copy(entry.pos);
      entry.sword.quaternion.copy(entry.quat).multiply(offsetQuat);
    }
  });

  // Attack (local player only)
  const control = app.control();
  let attacking = false;
  let reticleSpread = 0;

  function setSpread(value) {
    reticleSpread = value;
    world.setReticle({
      color: "#ccccdd",
      opacity: 0.85,
      spread: reticleSpread,
      layers: reticleConfig.layers,
    });
  }

  const spreadDecay = (delta) => {
    reticleSpread = Math.max(0, reticleSpread - 30 * delta);
    setSpread(reticleSpread);
    if (reticleSpread <= 0) {
      app.off("update", spreadDecay);
    }
  };

  control.mouseLeft.onPress = () => {
    if (attacking) return;
    const emoteUrl = props.attackEmote?.url;
    if (!emoteUrl) return;
    attacking = true;
    // Get local player's sword position for attack
    const localPlayer = world.getPlayer();
    const localEntry = swords.get(localPlayer.id);
    const pos = localEntry
      ? [
          localEntry.sword.position.x,
          localEntry.sword.position.y,
          localEntry.sword.position.z,
        ]
      : [
          localPlayer.position.x,
          localPlayer.position.y,
          localPlayer.position.z,
        ];
    app.send("attack", { position: pos });
    app.emit("sword-attack", { position: pos });
    // Spread kick on swing
    setSpread(16);
    app.on("update", spreadDecay);
    localPlayer.applyEffect({
      emote: emoteUrl,
      duration: 1,
      cancellable: false,
      turn: true,
      onEnd: () => {
        attacking = false;
      },
    });
  };
};
