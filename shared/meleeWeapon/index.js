import { WEAPON_ATTACK } from "./events.js";

/**
 * Shared melee weapon factory.
 *
 * Creates a hand-tracked weapon for every player with reticle,
 * attack input and networking built in.
 *
 * @param {object} world
 * @param {object} app
 * @param {object} props
 * @param {Function} setTimeout
 * @param {object} options
 * @returns {{ destroy: () => void }}
 */
export function createMeleeWeapon(world, app, props, setTimeout, options) {
  const {
    buildWeapon,
    reticle,
    attack,
    bone = "rightHand",
    offsetRotation = [-90, 0, 0],
    offsetPosition = [0.1, 0, 0],
    hitbox: hitboxConfig = { radius: 0.15, offsetY: 0.7 },
  } = options;

  const {
    button = "mouseLeft",
    eventName = WEAPON_ATTACK,
    networkEvent = "attack",
    emoteKey = "attackEmote",
    duration = 1,
    cancellable = false,
    turn = true,
    snare,
    freeze,
    spreadKick = 16,
    spreadDecayRate = 30,
  } = attack;

  // --- Server: relay attack events to other apps ---
  if (world.isServer) {
    app.on(networkEvent, (data) => {
      app.emit(eventName, data);
    });
    return { destroy() {} };
  }

  // --- Client ---

  // Swing state for trigger-based hit detection
  let swinging = false;
  const swingHits = new Set();

  const weapons = new Map();
  const offsetQuat = new Quaternion().setFromEuler(
    new Euler(
      offsetRotation[0] * DEG2RAD,
      offsetRotation[1] * DEG2RAD,
      offsetRotation[2] * DEG2RAD,
    ),
  );
  const offsetPos = new Vector3(
    offsetPosition[0],
    offsetPosition[1],
    offsetPosition[2],
  );

  function addPlayer(player) {
    if (weapons.has(player.id)) return;
    const weapon = buildWeapon(app);

    // Add trigger hitbox sphere to weapon for collision-based hit detection
    const isLocal = player.id === world.getPlayer()?.id;
    if (isLocal) {
      const hitSphere = app.create("prim", {
        type: "sphere",
        size: [hitboxConfig.radius],
        position: [0, hitboxConfig.offsetY, 0],
        opacity: 0,
        physics: "kinematic",
        trigger: true,
        tag: "weapon-hitbox",
        onTriggerEnter: (other) => {
          if (!swinging) return;
          const tag = other.tag;
          if (!tag || !tag.startsWith("npc:")) return;
          const npcAppId = tag.split(":")[1];
          if (swingHits.has(npcAppId)) return;
          swingHits.add(npcAppId);

          const localPlayer = world.getPlayer();
          app.send(networkEvent, { npcAppId, playerId: localPlayer.id });
          app.emit(eventName, { npcAppId, playerId: localPlayer.id });
        },
      });
      weapon.add(hitSphere);
    }

    world.add(weapon);
    weapons.set(player.id, {
      weapon,
      pos: new Vector3(),
      quat: new Quaternion(),
      offset: new Vector3(),
    });
  }

  function removePlayer(player) {
    const entry = weapons.get(player.id);
    if (entry) {
      world.remove(entry.weapon);
      weapons.delete(player.id);
    }
  }

  // Init weapons for all current players
  for (const player of world.getPlayers()) {
    addPlayer(player);
  }
  world.on("enter", addPlayer);
  world.on("leave", removePlayer);

  // Set reticle immediately (always equipped)
  const reticleConfig = {
    color: reticle.color,
    opacity: reticle.opacity,
    spread: 0,
    layers: reticle.layers,
  };
  world.setReticle(reticleConfig);

  // Update all weapons to track each player's hand bone
  const onUpdate = (delta) => {
    for (const player of world.getPlayers()) {
      const entry = weapons.get(player.id);
      if (!entry) {
        addPlayer(player);
        continue;
      }
      const matrix = player.getBoneTransform(bone);
      if (!matrix) continue;
      entry.pos.setFromMatrixPosition(matrix);
      entry.quat.setFromRotationMatrix(matrix);
      entry.offset.copy(offsetPos).applyQuaternion(entry.quat);
      entry.pos.add(entry.offset);
      entry.weapon.position.copy(entry.pos);
      entry.weapon.quaternion.copy(entry.quat).multiply(offsetQuat);
    }
  };
  app.on("update", onUpdate);

  // Attack (local player only)
  const control = app.control();
  let attacking = false;
  let reticleSpread = 0;

  function setSpread(value) {
    reticleSpread = value;
    world.setReticle({
      color: reticleConfig.color,
      opacity: reticleConfig.opacity,
      spread: reticleSpread,
      layers: reticleConfig.layers,
    });
  }

  const spreadDecay = (delta) => {
    reticleSpread = Math.max(0, reticleSpread - spreadDecayRate * delta);
    setSpread(reticleSpread);
    if (reticleSpread <= 0) {
      app.off("update", spreadDecay);
    }
  };

  control[button].onPress = () => {
    if (attacking) return;
    const emoteUrl = props[emoteKey]?.url;
    if (!emoteUrl) return;
    attacking = true;
    swinging = true;
    swingHits.clear();

    setSpread(spreadKick);
    app.on("update", spreadDecay);

    const localPlayer = world.getPlayer();
    const effect = {
      emote: emoteUrl,
      duration,
      cancellable,
      turn,
      onEnd: () => {
        attacking = false;
        swinging = false;
      },
    };
    if (snare !== undefined) effect.snare = snare;
    if (freeze !== undefined) effect.freeze = freeze;

    localPlayer.applyEffect(effect);
  };

  // Cleanup helper
  function destroy() {
    app.off("update", onUpdate);
    app.off("update", spreadDecay);
    world.off("enter", addPlayer);
    world.off("leave", removePlayer);
    for (const entry of weapons.values()) {
      world.remove(entry.weapon);
    }
    weapons.clear();
  }

  return { destroy };
}
