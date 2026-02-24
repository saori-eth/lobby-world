import { buildBody } from "./buildBody.js";
import { createBoneExplosion } from "./boneExplosion.js";
import { spawnBlood } from "../bloodSpatter.js";
import { createHealthBar } from "../healthBar.js";
import { spawnExplosion } from "../explosion.js";

export function createNPC(world, app, props, setTimeout, options = {}) {
  const {
    meshes: meshesOption,
    scale = 1,
    name = "NPC",
    hp = 100,
    maxHp = 100,
    respawnTime = 20,
    damageEvent = "sword-attack",
    attackRange = 2,
    damage = 25,
    maxDistance = 10,
    sendRate = 0.33,
    seed = 1,
    onDeath,
    onRespawn,
    onClientInit,
  } = options;

  const num = prng(seed);

  // --- Server logic ---
  if (world.isServer) {
    const state = app.state;
    state.name = name;
    state.hp = hp;
    state.maxHp = maxHp;

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
        if (app.position.distanceTo(ctrl.position) > maxDistance) {
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
      if (lastSend > sendRate) {
        lastSend = 0;
        app.send("change", [state.px, state.py, state.pz, state.ry, state.e]);
      }
    });

    // Listen for damage events
    world.on(damageEvent, (data) => {
      if (dead) return;
      attackPos.set(data.position[0], data.position[1], data.position[2]);
      const dist = attackPos.distanceTo(ctrl.position);
      if (dist > attackRange) return;

      state.hp = Math.max(0, state.hp - damage);
      app.send("hp", { hp: state.hp, max: state.maxHp });

      if (state.hp <= 0) {
        dead = true;
        app.send("die", {});
        if (onDeath) onDeath(state);
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
          const respawnData = {
            px: state.px,
            py: state.py,
            pz: state.pz,
            ry: state.ry,
            e: state.e,
            hp: state.hp,
            max: state.maxHp,
          };
          app.send("respawn", respawnData);
          if (onRespawn) onRespawn(state);
        }, respawnTime * 1000);
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
      const buildOpts = { scale };
      if (meshesOption) buildOpts.meshes = meshesOption;
      const { root, armature, animator, meshes } = buildBody(app, buildOpts);
      root.position.set(state.px, state.py, state.pz);
      root.rotation.y = state.ry;

      const nametag = app.create("nametag", { label: state.name });
      nametag.position.y = 1.9;
      root.add(nametag);

      world.add(root);

      if (onClientInit) onClientInit({ root, armature, animator, meshes });

      // --- Health bar UI ---
      const currentHp = state.hp || maxHp;
      const healthBar = createHealthBar(app, root, { hp: currentHp, maxHp });

      // --- Animator + interpolation ---
      animator.setEmote(state.e);
      let isDead = false;

      let position = new BufferedLerpVector3(root.position, sendRate * 1.2);

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

      // --- Bone explosion on death ---
      const boneExplosion = createBoneExplosion(app, world);

      // --- Client-side hit prediction ---
      const hitPos = new Vector3();
      const npcPos = new Vector3();
      let predictedHp = currentHp;

      world.on(damageEvent, (data) => {
        if (isDead) return;
        hitPos.set(data.position[0], data.position[1], data.position[2]);
        npcPos.copy(root.position);
        if (hitPos.distanceTo(npcPos) > attackRange) return;

        // Optimistic prediction
        predictedHp = Math.max(0, predictedHp - damage);
        healthBar.update(predictedHp, maxHp);
        spawnBlood(app, world, root.position, setTimeout);
      });

      // --- Server reconciliation ---
      app.on("hp", ({ hp: newHp, max }) => {
        predictedHp = newHp;
        healthBar.update(newHp, max);
      });

      app.on("die", () => {
        isDead = true;
        predictedHp = 0;
        spawnExplosion(app, world, root.position, setTimeout);
        boneExplosion.explode(root.position, meshes);
        root.active = false;
      });

      app.on("respawn", (data) => {
        boneExplosion.reset(armature, meshes);
        root.active = true;
        isDead = false;
        predictedHp = data.hp;
        root.position.set(data.px, data.py, data.pz);
        root.rotation.y = data.ry;
        position = new BufferedLerpVector3(root.position, sendRate * 1.2);
        animator.setEmote(data.e);
        nametag.active = true;
        healthBar.update(data.hp, data.max);
      });
    }
  }

  return { destroy: () => {} };
}
