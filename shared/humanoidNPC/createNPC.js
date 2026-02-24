import { buildBody } from "./buildBody.js";
import { createBoneExplosion } from "./boneExplosion.js";
import { spawnBlood } from "../bloodSpatter.js";
import { createHealthBar } from "../ui/healthBar.js";
import { createCombatText } from "../ui/combatText.js";
import { spawnExplosion } from "../explosion.js";
import { createRaidBridge } from "../gametype/raid.js";

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
    aggro = false,
    attackDamage = 10,
    attackCooldown = 1.5,
    chaseSpeed = 3.5,
    aggroRange = 15,
    aggroAttackRange = 1.8,
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

    const raid = createRaidBridge(world, app);

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

    // --- Aggro chase/attack state ---
    const chaseDir = new Vector3();
    let attackTimer = 0;

    function findNearestPlayer() {
      const players = world.getPlayers();
      let nearest = null;
      let nearestDist = Infinity;
      for (const player of players) {
        const dx = player.position.x - ctrl.position.x;
        const dz = player.position.z - ctrl.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = player;
        }
      }
      return { player: nearest, distance: nearestDist };
    }

    function aggroUpdate(delta) {
      attackTimer = Math.max(0, attackTimer - delta);

      const { player: target, distance } = findNearestPlayer();
      if (!target) {
        state.e = 2; // idle
        return;
      }

      // Leash: if target is too far from spawn, fall back to wandering
      const spawnDist = app.position.distanceTo(ctrl.position);
      if (distance > aggroRange || spawnDist > maxDistance) {
        // Return to spawn area using random wander action
        return true; // signal to fall back to wander
      }

      // Face target
      const dx = target.position.x - ctrl.position.x;
      const dz = target.position.z - ctrl.position.z;
      state.ry = Math.atan2(-dx, -dz);

      if (distance <= aggroAttackRange) {
        // Attack
        state.e = 5; // attack emote
        if (attackTimer <= 0) {
          raid.attackPlayer(app.id, target, attackDamage);
          attackTimer = attackCooldown;
          app.send("npc-attack", {});
        }
      } else {
        // Chase
        chaseDir.set(dx, 0, dz).normalize();
        v1.copy(chaseDir).multiplyScalar(delta * chaseSpeed);
        v1.y = -9.81;
        ctrl.move(v1);
        state.px = ctrl.position.x;
        state.py = ctrl.position.y;
        state.pz = ctrl.position.z;
        state.e = 1; // run
      }
      return false;
    }

    let action = getAction();
    let wanderFallback = false;
    app.on("fixedUpdate", (delta) => {
      if (dead) return;

      if (aggro && !wanderFallback) {
        const shouldWander = aggroUpdate(delta);
        if (shouldWander) {
          wanderFallback = true;
          action = getAction();
        }
      } else if (aggro && wanderFallback) {
        // Wander back, then re-check aggro
        const finished = action(delta);
        if (finished) {
          wanderFallback = false;
        }
      } else {
        const finished = action(delta);
        if (finished) action = getAction();
      }

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

      const isDead = state.hp <= 0;
      raid.reportHit(app.id, data.playerId, damage, isDead);

      if (isDead) {
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

      // --- Client-side NPC attack animation ---
      let attackAnimTimer = 0;
      app.on("npc-attack", () => {
        if (isDead) return;
        animator.setEmote(5); // attack
        attackAnimTimer = 0.5;
      });

      app.on("update", (delta) => {
        if (isDead) return;
        if (attackAnimTimer > 0) {
          attackAnimTimer -= delta;
          if (attackAnimTimer <= 0) {
            animator.setEmote(2); // back to idle
          }
        }
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
        createCombatText(app, world, {
          position: [root.position.x, root.position.y + 2, root.position.z],
          value: damage,
        });
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
