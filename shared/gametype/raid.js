import { createPlayerHUD } from "@shared/ui/playerHUD.js";
import { WEAPON_ATTACK, NPC_DAMAGE, NPC_HIT, NPC_ATTACK_PLAYER, RAID_PLAYER_DAMAGED, RAID_PLAYER_DIED } from "./raidEvents.js";

/**
 * Raid gametype — app logic for brokering NPC↔player damage and tracking stats.
 *
 * NPCs emit generic events ("npc:attack-player", "npc:hit") via app.emit.
 * This module listens for them via world.on and handles player HP, stats, and HUD.
 */

/**
 * Sets up all Raid app server + client logic.
 */
export function createRaidApp(world, app, opts = {}) {
  const maxHp = opts.maxHp || 100;

  if (world.isServer) {
    app.state.stats = {};
    app.state.maxHp = maxHp;
    app.state.players = {};
    app.state.ready = true;

    // Track player HP on enter/leave
    world.on("enter", (player) => {
      app.state.players[player.id] = { hp: maxHp };
    });

    world.on("leave", (player) => {
      delete app.state.players[player.id];
    });

    // Broker Weapon → NPC damage (pass-through, can add modifiers later)
    world.on(WEAPON_ATTACK, (data) => {
      app.emit(NPC_DAMAGE, data);
    });

    // Broker NPC → Player damage
    world.on(NPC_ATTACK_PLAYER, (data) => {
      console.log("[Raid] received npc:attack-player", JSON.stringify(data));
      const { npcId, targetPlayerId, damage } = data;
      const player = world.getPlayer(targetPlayerId);
      if (!player) return;

      // Track HP
      if (!app.state.players[targetPlayerId]) {
        app.state.players[targetPlayerId] = { hp: maxHp };
      }
      const pState = app.state.players[targetPlayerId];
      pState.hp = Math.max(0, pState.hp - damage);

      console.log("[Raid] sending player-damaged hp=" + pState.hp);
      app.send("player-damaged", {
        playerId: targetPlayerId,
        hp: pState.hp,
        maxHp,
        damage,
      });

      app.emit(RAID_PLAYER_DAMAGED, {
        playerId: targetPlayerId,
        damage,
        sourceId: npcId,
      });

      if (pState.hp <= 0) {
        app.emit(RAID_PLAYER_DIED, { playerId: targetPlayerId });
        // Reset HP after death
        pState.hp = maxHp;
      }
    });

    // Track NPC hit stats
    world.on(NPC_HIT, (data) => {
      const { attackerId, damage, dead } = data;
      if (!attackerId) return;

      if (!app.state.stats[attackerId]) {
        app.state.stats[attackerId] = { damageDealt: 0, kills: 0 };
      }
      const stat = app.state.stats[attackerId];
      stat.damageDealt += damage;
      if (dead) {
        stat.kills += 1;
      }
    });

    // Health recovery: +5 HP per second for all players not at full HP
    const regenRate = 5;
    const regenInterval = 1;
    let regenTimer = 0;
    app.on("fixedUpdate", (delta) => {
      regenTimer += delta;
      if (regenTimer < regenInterval) return;
      regenTimer -= regenInterval;
      for (const id in app.state.players) {
        const pState = app.state.players[id];
        if (pState.hp > 0 && pState.hp < maxHp) {
          pState.hp = Math.min(maxHp, pState.hp + regenRate);
          app.send("player-damaged", {
            playerId: id,
            hp: pState.hp,
            maxHp,
            damage: 0,
          });
        }
      }
    });

    app.send("init", app.state);
  }

  if (world.isClient) {
    if (app.state.ready) {
      init(app.state);
    } else {
      app.on("init", init);
    }

    function init(state) {
      const hud = createPlayerHUD(app, {
        hp: state.maxHp,
        maxHp: state.maxHp,
      });

      app.on("player-damaged", (data) => {
        console.log("[Raid][client] player-damaged", JSON.stringify(data));
        const localPlayer = world.getPlayer();
        if (!localPlayer || data.playerId !== localPlayer.id) return;
        hud.update(data.hp, data.maxHp);
      });

      app.on("destroy", () => {
        hud.destroy();
      });
    }
  }
}
