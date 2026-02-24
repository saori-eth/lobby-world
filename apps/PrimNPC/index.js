import { buildBody, createAnimator } from "./buildBody.js";
import { spawnBlood } from "@shared/bloodSpatter.js";
import { createHealthBar } from "@shared/healthBar.js";
import { createDeathFall } from "@shared/deathFall.js";

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
      const { root, bodyPivot, ...parts } = buildBody(app);
      root.position.set(state.px, state.py, state.pz);
      root.rotation.y = state.ry;

      const nametag = app.create("nametag", { label: state.name });
      nametag.position.y = 1.9;
      root.add(nametag);

      world.add(root);

      // --- Health bar UI ---
      const currentHp = state.hp || 100;
      const maxHp = state.maxHp || 100;
      const healthBar = createHealthBar(app, root, { hp: currentHp, maxHp });

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
      const deathFall = createDeathFall(app, bodyPivot);

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
        healthBar.update(predictedHp, maxHp);
        spawnBlood(app, world, root.position, setTimeout);
      });

      // --- Server reconciliation ---
      app.on("hp", ({ hp, max }) => {
        predictedHp = hp;
        healthBar.update(hp, max);
      });

      app.on("die", () => {
        isDead = true;
        predictedHp = 0;
        healthBar.ui.active = false;
        nametag.active = false;
        animator.setEmote(2);
        deathFall.start();
      });

      app.on("respawn", (data) => {
        deathFall.reset();
        isDead = false;
        predictedHp = data.hp;
        root.position.set(data.px, data.py, data.pz);
        root.rotation.y = data.ry;
        position.push([data.px, data.py, data.pz]);
        animator.setEmote(data.e);
        nametag.active = true;
        healthBar.update(data.hp, data.max);
      });
    }
  }
};
