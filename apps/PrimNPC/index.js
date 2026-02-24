export default (world, app, fetch, props, setTimeout) => {
  app.configure([{ key: "name", type: "text", label: "Name", initial: "NPC" }]);

  const SEND_RATE = 0.33;
  const MAX_DISTANCE = 10;
  const ATTACK_RANGE = 2;
  const DAMAGE = 25;
  const num = prng(1);

  // Hide default block mesh
  const block = app.get("Block");
  if (block) block.active = false;

  // --- Prim NPC body builder (hierarchical armature) ---
  function buildBody() {
    const root = app.create("group");

    // Torso
    const torso = app.create("prim", {
      type: "box",
      size: [0.5, 0.6, 0.3],
      position: [0, 1, 0],
      color: "#4488cc",
      physics: "kinematic",
    });

    // Collar detail
    const collar = app.create("prim", {
      type: "box",
      size: [0.44, 0.08, 0.28],
      position: [0, 0.27, 0],
      color: "#3377bb",
    });
    torso.add(collar);

    // Belt detail
    const belt = app.create("prim", {
      type: "box",
      size: [0.5, 0.06, 0.31],
      position: [0, -0.28, 0],
      color: "#664422",
    });
    torso.add(belt);

    // --- Head pivot (at top of torso) ---
    const headPivot = app.create("group");
    headPivot.position.set(0, 0.3, 0);

    const head = app.create("prim", {
      type: "box",
      size: [0.4, 0.4, 0.4],
      position: [0, 0.25, 0],
      color: "#f0c8a0",
      physics: "kinematic",
    });

    // Eyes (children of head)
    const eyeL = app.create("prim", {
      type: "box",
      size: [0.08, 0.08, 0.05],
      position: [-0.1, 0.05, -0.2],
      color: "#222222",
    });
    const eyeR = app.create("prim", {
      type: "box",
      size: [0.08, 0.08, 0.05],
      position: [0.1, 0.05, -0.2],
      color: "#222222",
    });
    head.add(eyeL);
    head.add(eyeR);

    // Baseball cap — low-profile crown + front brim
    const capCrown = app.create("prim", {
      type: "box",
      size: [0.42, 0.14, 0.42],
      position: [0, 0.24, 0],
      color: "#111111",
    });
    head.add(capCrown);

    // Front brim (extends forward)
    const capBrim = app.create("prim", {
      type: "box",
      size: [0.38, 0.04, 0.2],
      position: [0, 0.19, -0.24],
      color: "#111111",
    });
    head.add(capBrim);

    headPivot.add(head);
    torso.add(headPivot);

    // --- Left arm pivot (at shoulder) ---
    const armLPivot = app.create("group");
    armLPivot.position.set(-0.35, 0.25, 0);

    const armLUpper = app.create("prim", {
      type: "box",
      size: [0.2, 0.28, 0.2],
      position: [0, -0.14, 0],
      color: "#4488cc",
    });
    const armLLower = app.create("prim", {
      type: "box",
      size: [0.18, 0.26, 0.18],
      position: [0, -0.27, 0],
      color: "#f0c8a0",
    });
    armLUpper.add(armLLower);
    armLPivot.add(armLUpper);
    torso.add(armLPivot);

    // --- Right arm pivot (at shoulder) ---
    const armRPivot = app.create("group");
    armRPivot.position.set(0.35, 0.25, 0);

    const armRUpper = app.create("prim", {
      type: "box",
      size: [0.2, 0.28, 0.2],
      position: [0, -0.14, 0],
      color: "#4488cc",
    });
    const armRLower = app.create("prim", {
      type: "box",
      size: [0.18, 0.26, 0.18],
      position: [0, -0.27, 0],
      color: "#f0c8a0",
    });
    armRUpper.add(armRLower);
    armRPivot.add(armRUpper);
    torso.add(armRPivot);

    // --- Left leg pivot (at hip) ---
    const legLPivot = app.create("group");
    legLPivot.position.set(-0.13, -0.3, 0);

    const legLUpper = app.create("prim", {
      type: "box",
      size: [0.2, 0.28, 0.2],
      position: [0, -0.14, 0],
      color: "#555555",
    });
    const legLLower = app.create("prim", {
      type: "box",
      size: [0.2, 0.27, 0.2],
      position: [0, -0.275, 0],
      color: "#555555",
    });
    // Shoe
    const shoeL = app.create("prim", {
      type: "box",
      size: [0.22, 0.08, 0.26],
      position: [0, -0.175, -0.02],
      color: "#332211",
    });
    legLLower.add(shoeL);
    legLUpper.add(legLLower);
    legLPivot.add(legLUpper);
    torso.add(legLPivot);

    // --- Right leg pivot (at hip) ---
    const legRPivot = app.create("group");
    legRPivot.position.set(0.13, -0.3, 0);

    const legRUpper = app.create("prim", {
      type: "box",
      size: [0.2, 0.28, 0.2],
      position: [0, -0.14, 0],
      color: "#555555",
    });
    const legRLower = app.create("prim", {
      type: "box",
      size: [0.2, 0.27, 0.2],
      position: [0, -0.275, 0],
      color: "#555555",
    });
    // Shoe
    const shoeR = app.create("prim", {
      type: "box",
      size: [0.22, 0.08, 0.26],
      position: [0, -0.175, -0.02],
      color: "#332211",
    });
    legRLower.add(shoeR);
    legRUpper.add(legRLower);
    legRPivot.add(legRUpper);
    torso.add(legRPivot);

    // Body pivot at foot level — rotating its X tips the whole body forward/back
    const bodyPivot = app.create("group");
    bodyPivot.add(torso);
    root.add(bodyPivot);

    return {
      root,
      bodyPivot,
      headPivot,
      armLPivot,
      armRPivot,
      armLLower,
      armRLower,
      legLPivot,
      legRPivot,
      legLLower,
      legRLower,
      torso,
    };
  }

  // --- Procedural animation system (rotation-based) ---
  // Emote indices: 0=walk, 1=run, 2=idle, 3=wave, 4=dance
  function createAnimator(parts) {
    const {
      headPivot,
      armLPivot,
      armRPivot,
      armLLower,
      armRLower,
      legLPivot,
      legRPivot,
      legLLower,
      legRLower,
      torso,
    } = parts;

    let time = 0;
    let currentEmote = 2; // idle
    const torsoBaseY = 1;

    function resetPose() {
      headPivot.rotation.set(0, 0, 0);
      armLPivot.rotation.set(0, 0, 0);
      armRPivot.rotation.set(0, 0, 0);
      armLLower.rotation.set(0, 0, 0);
      armRLower.rotation.set(0, 0, 0);
      legLPivot.rotation.set(0, 0, 0);
      legRPivot.rotation.set(0, 0, 0);
      legLLower.rotation.set(0, 0, 0);
      legRLower.rotation.set(0, 0, 0);
      torso.position.y = torsoBaseY;
    }

    function update(delta) {
      time += delta;

      if (currentEmote === 0) {
        // Walk — pendulum limb swings
        const t = time * 5;
        const swing = Math.sin(t);
        armLPivot.rotation.x = swing * 0.4;
        armRPivot.rotation.x = -swing * 0.4;
        legLPivot.rotation.x = -swing * 0.35;
        legRPivot.rotation.x = swing * 0.35;
        // Slight knee bend at peak of step
        legLLower.rotation.x = Math.max(0, -Math.sin(t)) * 0.3;
        legRLower.rotation.x = Math.max(0, Math.sin(t)) * 0.3;
        // Subtle head bob
        headPivot.rotation.x = Math.sin(t * 2) * 0.02;
        torso.position.y = torsoBaseY + Math.sin(t * 2) * 0.01;
      } else if (currentEmote === 1) {
        // Run — faster, wider swings, more knee bend
        const t = time * 8;
        const swing = Math.sin(t);
        armLPivot.rotation.x = swing * 0.6;
        armRPivot.rotation.x = -swing * 0.6;
        armLLower.rotation.x = -0.4; // arms bent while running
        armRLower.rotation.x = -0.4;
        legLPivot.rotation.x = -swing * 0.5;
        legRPivot.rotation.x = swing * 0.5;
        legLLower.rotation.x = Math.max(0, -Math.sin(t)) * 0.6;
        legRLower.rotation.x = Math.max(0, Math.sin(t)) * 0.6;
        // Bounce
        torso.position.y = torsoBaseY + Math.abs(Math.sin(t)) * 0.03;
        headPivot.rotation.x = Math.sin(t * 2) * 0.03;
      } else if (currentEmote === 2) {
        // Idle — gentle breathing and sway
        const breath = Math.sin(time * 1.5);
        torso.position.y = torsoBaseY + breath * 0.01;
        armLPivot.rotation.z = Math.sin(time * 0.8) * 0.03;
        armRPivot.rotation.z = -Math.sin(time * 0.8) * 0.03;
        headPivot.rotation.y = Math.sin(time * 0.5) * 0.1;
        headPivot.rotation.x = Math.sin(time * 0.7) * 0.03;
      } else if (currentEmote === 3) {
        // Wave — right arm raised and waving
        armRPivot.rotation.z = -2.5;
        armRLower.rotation.x = Math.sin(time * 6) * 0.4;
        // Slight idle on other parts
        armLPivot.rotation.z = Math.sin(time * 0.8) * 0.03;
        headPivot.rotation.x = Math.sin(time * 2) * 0.05;
        headPivot.rotation.z = Math.sin(time * 2) * 0.05;
      } else if (currentEmote === 4) {
        // Dance — torso sway, alternating arm raises, hip motion
        const t = time * 6;
        const sway = Math.sin(time * 3);
        torso.position.y = torsoBaseY + Math.sin(t) * 0.04;
        headPivot.rotation.z = sway * 0.15;
        armLPivot.rotation.z = Math.sin(t) * 0.8 + 0.5;
        armRPivot.rotation.z = Math.sin(t + Math.PI) * 0.8 - 0.5;
        armLPivot.rotation.x = Math.sin(time * 3) * 0.3;
        armRPivot.rotation.x = Math.sin(time * 3 + Math.PI) * 0.3;
        legLPivot.rotation.x = Math.sin(t) * 0.2;
        legRPivot.rotation.x = Math.sin(t + Math.PI) * 0.2;
        legLLower.rotation.x = Math.max(0, Math.sin(t)) * 0.3;
        legRLower.rotation.x = Math.max(0, Math.sin(t + Math.PI)) * 0.3;
      }
    }

    function setEmote(idx) {
      if (idx === currentEmote) return;
      currentEmote = idx != null ? idx : 2;
      resetPose();
    }

    return { update, setEmote };
  }

  // --- Server logic ---
  if (world.isServer) {
    const RESPAWN_TIME = 3;

    const state = app.state;
    state.name = app.config.name || "NPC";
    state.hp = 100;
    state.maxHp = 100;

    const ctrl = app.create("controller");
    ctrl.position.copy(app.position);
    world.add(ctrl);

    const v1 = new Vector3();
    const attackPos = new Vector3();
    let lastSend = 0;
    let dead = false;
    const customEmoteIndices = [2, 3, 4]; // idle, wave, dance

    const actions = [
      () => {
        // Emote
        const idx = customEmoteIndices[num(0, customEmoteIndices.length - 1)];
        let time = num(1, 5, 2);
        return (delta) => {
          state.e = idx;
          time -= delta;
          return time <= 0;
        };
      },
      () => {
        // Move
        let angle = num(0, 360) * DEG2RAD;
        const eul = new Euler(0, angle, 0, "YXZ");
        const qua = new Quaternion().setFromEuler(eul);
        const direction = new Vector3(0, 0, -1);
        direction.applyQuaternion(qua);

        // Geo-fence
        if (app.position.distanceTo(ctrl.position) > MAX_DISTANCE) {
          direction.subVectors(app.position, ctrl.position);
          direction.y = 0;
          direction.normalize();
          const baseAngle = Math.atan2(-direction.x, -direction.z);
          const randomOffset = (num(0, 100) / 100 - 0.5) * 120 * DEG2RAD;
          angle = baseAngle + randomOffset;
          const randomEul = new Euler(0, angle, 0, "YXZ");
          const randomQua = new Quaternion().setFromEuler(randomEul);
          direction.set(0, 0, -1);
          direction.applyQuaternion(randomQua);
        }

        let time = num(1, 5, 2);
        const run = num(0, 1) === 1;
        const speed = run ? 4 : 2;

        return (delta) => {
          state.ry = angle;
          v1.copy(direction).multiplyScalar(delta * speed);
          v1.y = -9.81;
          ctrl.move(v1);
          state.px = ctrl.position.x;
          state.py = ctrl.position.y;
          state.pz = ctrl.position.z;
          state.e = run ? 1 : 0; // 1=run, 0=walk
          time -= delta;
          return time <= 0;
        };
      },
    ];

    function getAction() {
      return actions[num(0, actions.length - 1)]();
    }

    let action = getAction();
    app.on("fixedUpdate", (delta) => {
      if (dead) return;
      const finished = action(delta);
      if (finished) action = getAction();
      lastSend += delta;
      if (lastSend > SEND_RATE) {
        lastSend = 0;
        app.send("change", [state.px, state.py, state.pz, state.ry, state.e]);
      }
    });

    // Listen for sword attacks from any app
    world.on("sword-attack", (data) => {
      if (dead) return;
      attackPos.set(data.position[0], data.position[1], data.position[2]);
      const dist = attackPos.distanceTo(ctrl.position);
      if (dist > ATTACK_RANGE) return;

      state.hp = Math.max(0, state.hp - DAMAGE);
      app.send("hp", { hp: state.hp, max: state.maxHp });

      if (state.hp <= 0) {
        dead = true;
        app.send("die", {});
        setTimeout(() => {
          state.hp = state.maxHp;
          ctrl.position.copy(app.position);
          state.px = ctrl.position.x;
          state.py = ctrl.position.y;
          state.pz = ctrl.position.z;
          state.ry = 0;
          state.e = 2;
          dead = false;
          action = getAction();
          app.send("respawn", {
            px: state.px,
            py: state.py,
            pz: state.pz,
            ry: state.ry,
            e: state.e,
            hp: state.hp,
            max: state.maxHp,
          });
        }, RESPAWN_TIME * 1000);
      }
    });

    state.px = ctrl.position.x;
    state.py = ctrl.position.y;
    state.pz = ctrl.position.z;
    state.ry = 0;
    state.e = 2; // idle
    state.ready = true;
    app.send("init", state);
  }

  // --- Client logic ---
  if (world.isClient) {
    if (app.state.ready) {
      init(app.state);
    } else {
      app.on("init", init);
    }

    function init(state) {
      const { root, bodyPivot, ...parts } = buildBody();
      root.position.set(state.px, state.py, state.pz);
      root.rotation.y = state.ry;

      const nametag = app.create("nametag", { label: state.name });
      nametag.position.y = 1.9;
      root.add(nametag);

      world.add(root);

      // --- Health bar UI ---
      const healthUI = app.create("ui", {
        space: "world",
        billboard: "y",
        width: 60,
        height: 8,
        size: 0.01,
        pointerEvents: false,
      });
      healthUI.position.y = 2.1;

      const bgBar = app.create("uiview", {
        width: 60,
        height: 8,
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: 4,
        flexDirection: "row",
      });

      const fillBar = app.create("uiview", {
        width: 60,
        height: 8,
        backgroundColor: "#00d26a",
        borderRadius: 4,
      });

      bgBar.add(fillBar);
      healthUI.add(bgBar);
      root.add(healthUI);

      // Start hidden (full health)
      let currentHp = state.hp || 100;
      let maxHp = state.maxHp || 100;
      healthUI.active = currentHp < maxHp;

      function updateHealthBar(hp, max) {
        currentHp = hp;
        maxHp = max;
        const ratio = hp / max;
        fillBar.width = Math.round(60 * ratio);
        // Color: green > yellow > red
        if (ratio > 0.5) {
          fillBar.backgroundColor = "#00d26a";
        } else if (ratio > 0.25) {
          fillBar.backgroundColor = "#ffc048";
        } else {
          fillBar.backgroundColor = "#ff4757";
        }
        healthUI.active = hp < max && hp > 0;
      }

      // --- Animator + interpolation ---
      const animator = createAnimator(parts);
      animator.setEmote(state.e);
      let isDead = false;

      const position = new BufferedLerpVector3(root.position, SEND_RATE * 1.2);

      app.on("change", ([px, py, pz, ry, e]) => {
        if (isDead) return;
        position.push([px, py, pz]);
        root.rotation.y = ry;
        animator.setEmote(e);
      });

      app.on("update", (delta) => {
        if (isDead) return;
        position.update(delta);
        animator.update(delta);
      });

      // --- Death fall-over animation ---
      const FALL_TARGET = 90 * DEG2RAD; // tip forward 90 degrees
      const FALL_SPEED = 3; // radians per second (~0.5s to fall)
      // When tipped 90deg the torso center (y=1) lands at y=0, so the bottom
      // half (~0.3m thick) clips underground. A small lift keeps it on the surface.
      const FALL_LIFT = 0.3;
      let falling = false;

      const fallUpdate = (delta) => {
        if (!falling) return;
        bodyPivot.rotation.x += FALL_SPEED * delta;
        if (bodyPivot.rotation.x >= FALL_TARGET) {
          bodyPivot.rotation.x = FALL_TARGET;
          bodyPivot.position.y = FALL_LIFT;
          falling = false;
          app.off("update", fallUpdate);
        } else {
          // Lift proportionally as rotation progresses
          const t = bodyPivot.rotation.x / FALL_TARGET;
          bodyPivot.position.y = t * FALL_LIFT;
        }
      };

      // --- Blood splatter particles ---
      function spawnBlood() {
        const blood = app.create("particles", {
          shape: ["sphere", 0.3, 1],
          rate: 0,
          bursts: [{ time: 0, count: 12 }],
          duration: 0.1,
          loop: false,
          life: "0.3~0.6",
          speed: "1~3",
          size: "0.04~0.08",
          color: "#8b0000",
          force: new Vector3(0, -6, 0),
          direction: 1,
          blending: "normal",
          max: 20,
        });
        blood.position.set(
          root.position.x,
          root.position.y + 1,
          root.position.z
        );
        world.add(blood);
        setTimeout(() => {
          world.remove(blood);
        }, 1000);
      }

      // --- Client-side hit prediction ---
      const hitPos = new Vector3();
      const npcPos = new Vector3();
      let predictedHp = currentHp;

      world.on("sword-attack", (data) => {
        if (isDead) return;
        hitPos.set(data.position[0], data.position[1], data.position[2]);
        npcPos.copy(root.position);
        if (hitPos.distanceTo(npcPos) > ATTACK_RANGE) return;

        // Optimistic prediction
        predictedHp = Math.max(0, predictedHp - DAMAGE);
        updateHealthBar(predictedHp, maxHp);
        spawnBlood();
      });

      // --- Server reconciliation ---
      app.on("hp", ({ hp, max }) => {
        predictedHp = hp;
        updateHealthBar(hp, max);
      });

      app.on("die", () => {
        isDead = true;
        predictedHp = 0;
        healthUI.active = false;
        nametag.active = false;
        // Reset pose before falling so limbs are neutral
        animator.setEmote(2);
        falling = true;
        app.on("update", fallUpdate);
      });

      app.on("respawn", (data) => {
        // Stop fall animation if still running
        falling = false;
        app.off("update", fallUpdate);
        // Reset body pivot
        bodyPivot.rotation.x = 0;
        bodyPivot.position.y = 0;
        isDead = false;
        predictedHp = data.hp;
        root.position.set(data.px, data.py, data.pz);
        root.rotation.y = data.ry;
        position.push([data.px, data.py, data.pz]);
        animator.setEmote(data.e);
        nametag.active = true;
        updateHealthBar(data.hp, data.max);
      });
    }
  }
};
