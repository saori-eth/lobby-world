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

  if (!world.isClient) return;

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
  };

  // Left click to attack
  let attacking = false;
  control.mouseLeft.onPress = () => {
    if (!held || attacking) return;
    const emoteUrl = props.attackEmote?.url;
    if (!emoteUrl) return;
    attacking = true;
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
    sword.position.copy(handPos);
    sword.quaternion.copy(handQuat).multiply(offsetQuat);
  }
};
