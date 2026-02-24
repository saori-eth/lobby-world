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

  const sword = buildSword();
  sword.position.set(0, 0, 0);
  app.add(sword);

  let held = false;
  const handPos = new Vector3();
  const handQuat = new Quaternion();
  const handOffset = new Vector3();
  // Offset so blade points forward/up from the hand
  const offsetQuat = new Quaternion().setFromEuler(
    new Euler(-90 * DEG2RAD, 0, 0),
  );

  const pickupAction = app.create("action", {
    label: "Pick Up",
    position: [0, 0.4, 0],
  });
  pickupAction.onTrigger = () => {
    held = true;
    app.remove(sword);
    pickupAction.active = false;
    world.add(sword);
    app.on("update", trackHand);
    // Sword crosshair reticle
    world.setReticle({
      color: "#ccccdd",
      opacity: 0.85,
      spread: 0,
      layers: [
        // Blade up
        { shape: "line", length: 8, gap: 3, angle: 0, thickness: 1.5 },
        // Blade down
        { shape: "line", length: 8, gap: 3, angle: 180, thickness: 1.5 },
        // Guard left
        {
          shape: "line",
          length: 5,
          gap: 2,
          angle: 90,
          thickness: 2,
          color: "#8B7333",
        },
        // Guard right
        {
          shape: "line",
          length: 5,
          gap: 2,
          angle: 270,
          thickness: 2,
          color: "#8B7333",
        },
        // Pommel
        { shape: "dot", radius: 1.5, color: "#8B7333" },
      ],
    });
  };
  app.add(pickupAction);

  // Bind X key to drop
  const control = app.control();
  control.keyX.onPress = () => {
    if (!held) return;
    held = false;
    app.off("update", trackHand);
    world.remove(sword);
    sword.position.set(0, 0, 0);
    sword.quaternion.identity();
    app.add(sword);
    pickupAction.active = true;
    world.setReticle(null);
  };

  // Left click to attack
  let attacking = false;
  let reticleSpread = 0;

  function setSpread(value) {
    reticleSpread = value;
    world.setReticle({
      color: "#ccccdd",
      opacity: 0.85,
      spread: reticleSpread,
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
    if (!held || attacking) return;
    const emoteUrl = props.attackEmote?.url;
    if (!emoteUrl) return;
    attacking = true;
    // Send attack position to server for authoritative damage
    const pos = [sword.position.x, sword.position.y, sword.position.z];
    app.send("attack", { position: pos });
    // Also emit locally so NPC clients can predict the hit instantly
    app.emit("sword-attack", { position: pos });
    // Spread kick on swing
    setSpread(16);
    app.on("update", spreadDecay);
    world.getPlayer().applyEffect({
      emote: emoteUrl,
      duration: 1,
      cancellable: false,
      turn: true,
      onEnd: () => {
        attacking = false;
      },
    });
  };

  function trackHand(delta) {
    const player = world.getPlayer();
    const matrix = player.getBoneTransform("rightHand");
    if (!matrix) return;
    handPos.setFromMatrixPosition(matrix);
    handQuat.setFromRotationMatrix(matrix);
    // Shift from wrist to palm along the hand's local Z axis (finger direction)
    handOffset.set(0.1, 0, 0).applyQuaternion(handQuat);
    handPos.add(handOffset);
    sword.position.copy(handPos);
    sword.quaternion.copy(handQuat).multiply(offsetQuat);
  }
};
