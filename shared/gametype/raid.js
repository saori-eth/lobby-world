import { createPlayerHUD } from "@shared/ui/playerHUD.js";

/**
 * Raid gametype — event constants, NPC bridge helper, and app logic.
 */

export const EVENTS = {
  NPC_ATTACK: "raid:npc-attack",
  PLAYER_DAMAGED: "raid:player-damaged",
  NPC_HIT: "raid:npc-hit",
  PING: "raid:ping",
  PONG: "raid:pong",
};

/**
 * Creates a bridge for NPCs to communicate with the Raid app.
 * Uses app.emit for cross-app events and world.on to listen.
 */
export function createRaidBridge(world, app) {
  let connected = false;

  // Listen for pong from Raid app
  world.on(EVENTS.PONG, () => {
    console.log("[RaidBridge] received PONG — connected!");
    connected = true;
  });

  // Ping to see if Raid app is present
  console.log("[RaidBridge] sending PING");
  app.emit(EVENTS.PING, {});

  return {
    /**
     * Request damage on a player. If Raid app is active, emits intent event.
     * Otherwise falls back to direct damage.
     */
    attackPlayer(npcId, targetPlayer, damage) {
      console.log("[RaidBridge] attackPlayer connected=" + connected, npcId, targetPlayer.id, damage);
      if (connected) {
        app.emit(EVENTS.NPC_ATTACK, {
          npcId,
          targetPlayerId: targetPlayer.id,
          damage,
        });
      }
    },

    /**
     * Report that an NPC was hit by a player (for stat tracking).
     */
    reportHit(npcId, attackerId, damage, dead) {
      if (connected) {
        app.emit(EVENTS.NPC_HIT, {
          npcId,
          attackerId,
          damage,
          dead,
        });
      }
    },
  };
}

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

    // Respond to pings so NPC bridges know we're active
    world.on(EVENTS.PING, () => {
      console.log("[Raid] received PING, sending PONG");
      app.emit(EVENTS.PONG, {});
    });

    // Announce presence for any NPCs that initialized before us
    console.log("[Raid] announcing PONG on init");
    app.emit(EVENTS.PONG, {});

    // Track player HP on enter/leave
    world.on("enter", (player) => {
      app.state.players[player.id] = { hp: maxHp };
    });

    world.on("leave", (player) => {
      delete app.state.players[player.id];
    });

    // Broker NPC → Player damage
    world.on(EVENTS.NPC_ATTACK, (data) => {
      console.log("[Raid] received NPC_ATTACK", JSON.stringify(data));
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

      app.emit(EVENTS.PLAYER_DAMAGED, {
        playerId: targetPlayerId,
        damage,
        sourceId: npcId,
      });

      if (pState.hp <= 0) {
        app.emit("raid:player-died", { playerId: targetPlayerId });
        // Reset HP after death
        pState.hp = maxHp;
      }
    });

    // Track NPC hit stats
    world.on(EVENTS.NPC_HIT, (data) => {
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
